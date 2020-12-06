const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validInput = require('../utils/validInput');
const verify = require('../utils/verifyToken');

var multer  = require('multer');
const { Storage } = require('@google-cloud/storage');
const MAX_SIZE_IMAGE = 4 * 1024 * 1024; // for 4MB

// Create new storage instance with Firebase project credentials
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
      private_key: process.env.private_key,
      client_email: process.env.client_email
  }
});

// Create a bucket associated to Firebase storage bucket
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET_URL);

// Initiating a memory storage engine to store files as Buffer objects
const uploader = multer({
  storage: multer.memoryStorage(),
});

router.post ('/get_user_info', verify, async (req, res) => {
  let { user_id } = req.body;
  if (!user_id) user_id = req.user.id;
  let user;
  let data = {
    id: null,
    username: null,
    created: null,
    description: null,
    avatar: null,
    cover_image: null,
    link: null,
    address: null,
    city: null,
    country: null,
    listing: null,
    is_friend: null,
    online: null
  }
  try {
    user = await User.findById(user_id);
    data.id = user._id.toString();
    data.username = user.name;
    data.created = user.createdAt;
    data.description = user.description;
    data.avatar= user.avatar;
    data.cover_image = user.coverImage;
    data.link = user.link;
    data.address = user.address;
    data.city = user.city;
    data.country = user.country;
    data.listing = user.friends.length;
    if (user_id != req.user.id) {
      let indexExist = user.friends.findIndex(element => element.friend._id.equals(req.user.id)); 
      data.is_friend =  (indexExist >= 0) ? true : false;
    }
    return res.status(200).json({code: 1000, message: "OK", data: data });
  } catch (error) {
    if (!user) return res.status(400).json({code: 1004, message: "truyền sai tham số, user không tìm được"});
    else return res.status(500).json({code: 1005, message: error.message});
  }
});

var cpUpload = uploader.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover_image', maxCount: 1 }]);
router.post('/set_user_info', cpUpload, verify, async (req, res) => {
  let { username, description, address, city,country, link} = req.body;
  let fileAvatar, fileCoverImage, linkAvatar, linkCoverImage;
  if (req.files.avatar != undefined) fileAvatar = req.files.avatar[0];
  if (req.files.cover_image != undefined) fileCoverImage = req.files.cover_image[0];


  try {
    let user = await User.findById(req.user.id);
    if (fileAvatar) {
      if (!checkSizeImage(fileAvatar)) 
        return res.status(400).json({ code: 1004, message: "file quá lớn, max = 4MB"});
      if (!checkTypeImage(fileAvatar))
        return res.status(400).json({ code: 1004, message: "sai định dạng file"});
      let promise1 = await uploadFile(fileAvatar);
      linkAvatar = promise1.url;
    } 
    if (fileCoverImage) {
      if (!checkSizeImage(fileCoverImage)) 
        return res.status(400).json({ code: 1004, message: "file quá lớn, max = 4MB"});
      if (!checkTypeImage(fileCoverImage))
        return res.status(400).json({ code: 1004, message: "sai định dạng file"});
      let promise2 = await uploadFile(fileCoverImage);
      linkCoverImage = promise2.url;
    } 
    user.name = username;
    user.description = description;
    user.address = address;
    user.city = city;
    user.country = country;
    user.link = link;
    user.avatar.url = linkAvatar;
    user.coverImage.url = linkCoverImage;
    user = await user.save();
    //return res.json({ code: 1000, message: "OK", data: { city, country, link, avatar: linkAvatar, cover_image: linkCoverImage}}); 
    return res.json({ code: 1000, message: "OK", data: {
      avatar: user.avatar.url,
      cover_image: user.coverImage.url,
      link: user.link,
      address: user.address,
      city: user.city, 
      country: user.country, 
      username: user.name,
      description: user.description
    }}); 
  } catch (error) {
    return res.json({ code: 1005, message: error.message});
  }
})

module.exports = router;

const checkSizeImage = (image) => image.size <= MAX_SIZE_IMAGE ;

const checkTypeImage = (image) => {
  const filetypes = /jpeg|jpg|png/; 
  return filetypes.test(image.mimetype);
}

function uploadFile(file) {
  const newNameFile = new Date().toISOString() + file.originalname;
      const blob = bucket.file(newNameFile);
      const blobStream = blob.createWriteStream({
      metadata: {
          contentType: file.mimetype,
      },
  });
  const publicUrl =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURI(blob.name)}?alt=media`;
  return new Promise((resolve, reject) => {

      blobStream.on('error', reject);
      blobStream.end(file.buffer, resolve({url: publicUrl}));
  });
}