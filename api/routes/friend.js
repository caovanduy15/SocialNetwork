const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const verify = require('../utils/verifyToken');

// @route  POST it4788/friend/get_requested_friends
// @access Public
// Example: Use Postman
// URL: http://127.0.0.1:5000/it4788/friend/get_requested_friends
// -------------------------
// index : last addElement
// count: length of data
// -------------------------
// BODY: 
// {
//   "token": "xxxxx",
//   "index": 3, 
//   "count": 10
// }
router.post('/get_requested_friends', verify, async (req, res) => {
  let { token, index, count } = req.body;
  let id = req.user.id;
  let code, message;
  let data = {
    request: [],
    total: 0
  };
  let thisUser;


  try {
    thisUser = await User.findById(id)
      .select({ "friends": 1, "friendRequestReceived": 1, "_id": 1 })
      .populate('friendRequestReceived');
    // console.log(thisUser);

    let endFor = thisUser.friendRequestReceived.length < index + count ? thisUser.friendRequestReceived.length : index + count;
    for (let i = index; i < endFor; i++) {
      let sentUser;
      let newElement = {
        id: null, // id người gửi req
        username: null, // tên người gửi req
        avatar: null, // link avatar người gửi req
        same_friends: null, // số bạn chung
        created: null, // thời gian gần nhất req
      }
      let sentUserID = thisUser.friendRequestReceived[i].fromUser.toString();
      sentUser = await User.findById(sentUserID)
        .select({ "friends": 1, "friendRequestSent": 1, "phoneNumber": 1, "_id": 1, "name": 1, "avatar": 1 });

      // console.log(sentUser);
      newElement.id = sentUser._id;
      newElement.username = sentUser.name;
      newElement.avatar = sentUser.avatar;
      newElement.same_friends = 0;
      // find number of same_friends
      if (thisUser.friends.length != 0 && sentUser.friends.length != 0) {
        newElement.same_friends = countSameFriend(thisUser.friends, sentUser.friends);
      }
      newElement.created = thisUser.friendRequestReceived[i].lastCreated;
      data.request.push(newElement);
    }
    thisUser = await User.findById(id);
    data.total = thisUser.friendRequestReceived.length;
    code = 1000;
    message = "OK";
  } catch (error) {
    code = 1005;
    message = error.message;
  }


  res.json({ code, message, data });
})


// @route  POST it4788/friend/set_request_friend
// @access Public
// Example: Use Postman
// URL: http://127.0.0.1:5000/it4788/friend/set_request_friend
// BODY: 
// {
//   "token": "xxxxx",
//   "user_id" : "gh98082"
// }
router.post('/set_request_friend', verify, async (req, res) => {
  let code, message;
  let data = {
    requested_friends: null // số người đang đươc tài khoản hiện tại gửi request friend
  }

  let { token, user_id } = req.body; // user_id là id của người nhận request friend
  let id = req.user.id;
  let targetUser, thisUser;
  if (id == user_id) {
    code = 1004;
    message = "invalid parameter";
  } else {
    try {
      targetUser = await User.findById(user_id);
      thisUser = await User.findById(id);

      let indexExist = thisUser.friends.findIndex(element => element.friend._id.equals(targetUser._id));
      if (indexExist < 0) {
        thisUser.friendRequestSent.push();

        // add new element to sent request
        let addElement = { "_id": targetUser._id };
        let isExisted = thisUser.friendRequestSent.findIndex(element => element._id.equals(addElement._id));
        if (isExisted < 0) {
          thisUser.friendRequestSent.push(addElement);
          thisUser = await thisUser.save();
        }

        // add new or update exist element of request received
        let addElement1 = { fromUser: { "_id": thisUser._id } };
        let isExisted1 = targetUser.friendRequestReceived.findIndex(element =>
          element.fromUser._id.equals(addElement1.fromUser._id));

        if (isExisted1 < 0) {
          targetUser.friendRequestReceived.push(addElement1);
        } else {
          let currentTime = Date.now();
          targetUser.friendRequestReceived[isExisted1].lastCreated = currentTime;
        }
        targetUser = await targetUser.save();
        code = 1000;
        message = "OK";
      } else {
        code = 1010;
        message = "you two are friend already!!"
      }
      data.requested_friends = thisUser.friendRequestSent.length;

    } catch (err) {
      if (!targetUser) {
        code = 1004;
        message = "not found user_id";
      }
      else {
        code = 1005;
        message = "Unknown error";
      }

    }
  }

  res.json({ code, message, data })
})

// @route  POST it4788/friend/set_accept_friend
// @access Public
// Example: Use Postman
// URL: http://127.0.0.1:5000/it4788/friend/set_accept_friend
// BODY: 
// {
//   "token": "xxxxx",
//   "user_id" : "gh98082",
//   "is_accept": 0,
// }
router.post('/set_accept_friend', verify, async (req, res) => {
  let code, message;
  let thisUser, sentUser;

  // user_id là id của người nhận request friend
  // is_accept : 0 là từ chối, 1 là đồng ý
  let { token, user_id, is_accept } = req.body;
  let id = req.user.id;
  if (id == user_id) {
    code = 1004;
    message = "invalid parameter";
  } else {
    try {
      thisUser = await User.findById(id);
      sentUser = await User.findById(user_id);

      // chưa có kiểm tra đã yêu cầu chưa 
      let checkindex = thisUser.friendRequestReceived.findIndex(element =>
        element.fromUser._id.equals(sentUser._id));
      if(checkindex < 0) return res.json({ code: 1004, message: "chưa gửi lời mời"});
      if (is_accept == 0) {
        // xóa req bên nhận

        let indexExist = thisUser.friendRequestReceived.findIndex(element =>
          element.fromUser._id.equals(sentUser._id));
        thisUser.friendRequestReceived.splice(indexExist, 1);

        // xóa req bên gửi
        let indexExist1 = sentUser.friendRequestSent.findIndex(element =>
          element._id.equals(thisUser._id));

        sentUser.friendRequestSent.splice(indexExist1, 1);
        // save
        thisUser = await thisUser.save();
        sentUser = await sentUser.save();
        code = 1000;
        message = "OK";
      } else if (is_accept == 1) {
        // xóa req bên nhận
        let currentTime = Date.now();
        let indexExist = thisUser.friendRequestReceived.findIndex(element =>
          element.fromUser._id.equals(sentUser._id));
        thisUser.friendRequestReceived.splice(indexExist, 1);

        // thêm bạn bên nhận 
        let indexExist2 = thisUser.friends.findIndex(element =>
          element.friend._id.equals(sentUser._id))
        if (indexExist2 < 0) thisUser.friends.push({ friend: sentUser._id, createdAt: currentTime });

        // thêm bạn bên gửi 
        let indexExist3 = sentUser.friends.findIndex(element =>
          element.friend._id.equals(thisUser._id))
        if (indexExist3 < 0) sentUser.friends.push({ friend: thisUser._id, createdAt: currentTime });
        // xóa req bên gửi
        let indexExist1 = sentUser.friendRequestSent.findIndex(element =>
          element._id.equals(thisUser._id));

        sentUser.friendRequestSent.splice(indexExist1, 1);
        // save
        thisUser = await thisUser.save();
        sentUser = await sentUser.save();
        code = 1000;
        message = "OK";
      } else {
        code = 1004;
        message = "invalid parameter";
      }

    } catch (error) {
      code = 1005;
      message = "Unknown Error";
    }

  }

  res.json({ code, message });
})

// @route  POST it4788/friend/get_user_friends
// @access Public
// Example: Use Postman
// URL: http://127.0.0.1:5000/it4788/friend/get_user_friends
// BODY: 
// {
//   "token": "xxxxx",
//   "user_id" : "gh98082",
//   "index": 4,
//   "count": 10
// }
router.post('/get_user_friends', verify, async (req, res) => {
  // input 
  let { user_id, token, index, count } = req.body;
  // user id from token
  let id = req.user.id;
  // output
  let code, message;
  let data = {
    friends: [],
    total: 0
  }

  // var
  let thisUser, targetUser;

  try {
    thisUser = await User.findById(id).select({ "friends": 1 });
    // console.log(thisUser);
    if (user_id && user_id != id) {
      targetUser = await User.findById(user_id).select({ "friends": 1 });
    } else {
      targetUser = thisUser;
    }
    await targetUser.populate({ path: 'friends.friend', select: 'friends' }).execPopulate();
    // console.log(targetUser);

    let endFor = targetUser.friends.length < index + count ? targetUser.friends.length : index + count;
    for (let i = index; i < endFor; i++) {
      let x = targetUser.friends[i];
      let friendInfor = {
        id: null, // id of this guy
        username: null,
        avatar: null,
        same_friends: 0, //number of same friends
        created: null //time start friend between this guy and targetUser
      }
      friendInfor.id = x.friend._id.toString();
      friendInfor.username = x.friend.username;
      friendInfor.avatar = x.friend.avatar;
      friendInfor.created = x.createdAt;
      if (!thisUser._id.equals(x.friend._id))
        if (thisUser.friends.length > 0 && x.friend.friends.length > 0) {
          friendInfor.same_friends = countSameFriend(thisUser.friends, x.friend.friends);
        }
      data.friends.push(friendInfor);
    }
    data.total = targetUser.friends.length;
  } catch (error) {
    if (user_id && !targetUser) {
      code = 1004;
      message = "invalid parameter";
    } else {
      code = 1005;
      message = error.message;
    }
  }

  res.json({ code, message, data});
})

// count same friend between 2 array x, y
function countSameFriend(x, y) {
  let xx = x.map(e => e.friend.toString());
  let yy = y.map(e => e.friend.toString());
  let z = xx.filter(function (val) {
    return yy.indexOf(val) != -1;
  });
  return z.length;
}

module.exports = router;