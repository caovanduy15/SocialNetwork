const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const verify = require('../utils/verifyToken');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

//Not API
router.post('/create_conversation', async (req, res) => {
    let { conversationId, firstUserId, secondUserId } = req.body;
    let firstUser, secondUser;
    firstUser = await User.findById(firstUserId);
    secondUser = await User.findById(secondUserId);
    const newConversation = new Conversation({
        conversationId: conversationId,
        firstUser: firstUser._id,
        secondUser: secondUser._id
    });
    newConversation.save();
    res.json({ message: "OK" });
});
//Not API
router.post('/add_dialog', async (req, res) => {
    let { conversationId, dialogId, senderId, content } = req.body;
    let conversation, sender;
    sender = await User.findById(senderId);
    conversation = await Conversation.findOne({conversationId});
    conversation.dialog.push({
        dialogId: dialogId,
        sender: senderId,
        content: content
    })
    conversation.save();
    res.json({ message: "OK" });
});

router.post('/get_conversation', verify, async (req, res) => {
    let code, message;
    let id = req.user.id;
    let data = {
        conversation: []
    }
    if (req.body.index === undefined || req.body.count === undefined){
        code = "1002";
        message = "Please enter all fields";
        res.json({ code, message });
        return;
    }
    if (req.body.partnerId){
        let targetConversation;
        let { index, count, partnerId } = req.body;
        let targetConversation1 = await Conversation.findOne({ firstUser: partnerId });
        let targetConversation2 = await Conversation.findOne({ secondUser: partnerId });
        if (targetConversation1){
            if (targetConversation1.secondUser == id){
                targetConversation = targetConversation1;
            }
        }
        else if (targetConversation2){
            if (targetConversation2.firstUser == id){
                targetConversation = targetConversation2;
            }
        }
        else {
            code = "9995";
            message = "Conversation not existed";
            res.json({ code, message });
            return;
        }
        let endFor = targetConversation.dialog.length < index + count ? targetConversation.dialog.length : index + count;
        for (let i = index; i < endFor; i++){
            let x = targetConversation.dialog[i];
            let dialogInfo = {
                message: null,
                message_id: null,
                unread: null,
                created: null,
                sender: {
                    id: null,
                    username: null,
                    avatar: null
                }
            }
            let targetUser;
            targetUser = await User.findById(x.sender);
            dialogInfo.message = x.content;
            dialogInfo.message_id = x.dialogId;
            dialogInfo.unread = !x.read;
            dialogInfo.created = x.created;
            dialogInfo.sender.id = targetUser._id;
            dialogInfo.sender.username = targetUser.name;
            dialogInfo.sender.avatar = targetUser.avatar;
            data.conversation.push(dialogInfo);
        }
        code = "1000";
        message = "Successfully get conversation information";
    }
    else {
        let targetConversation;
        let { index, count, conversationId } = req.body;
        targetConversation = await Conversation.findOne({ conversationId: conversationId });
        if (!targetConversation){
            code = "9995";
            message = "Conversation not existed";
            res.json({ code, message });
            return;
        }
        let endFor = targetConversation.dialog.length < index + count ? targetConversation.dialog.length : index + count;
        for (let i = index; i < endFor; i++){
            let x = targetConversation.dialog[i];
            let dialogInfo = {
                message: null,
                message_id: null,
                unread: null,
                created: null,
                sender: {
                    id: null,
                    username: null,
                    avatar: null
                }
            }
            let targetUser;
            targetUser = await User.findById(x.sender);
            dialogInfo.message = x.content;
            dialogInfo.message_id = x.dialogId;
            dialogInfo.unread = !x.read;
            dialogInfo.created = x.created;
            dialogInfo.sender.id = targetUser._id;
            dialogInfo.sender.username = targetUser.name;
            dialogInfo.sender.avatar = targetUser.avatar;
            data.conversation.push(dialogInfo);
        }
        code = "1000";
        message = "Successfully get conversation information";
    }

    res.json({ code, message, data });
});

module.exports = router;
