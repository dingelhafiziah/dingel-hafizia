const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
router.post('/add', async (req,res)=>{ try { const receiptNo='DHM-'+Date.now().toString().slice(-8); const transaction=await Transaction.create({...req.body,amount:Number(req.body.amount),receiptNo}); res.status(201).json({message:'Transaction saved',transaction}); } catch(e){ res.status(400).json({error:e.message}); }});
router.get('/summary', async (req,res)=>{ try { const [income,expense]=await Promise.all([Transaction.aggregate([{$match:{type:'INCOME'}},{$group:{_id:null,total:{$sum:'$amount'}}}]),Transaction.aggregate([{$match:{type:'EXPENSE'}},{$group:{_id:null,total:{$sum:'$amount'}}}])]); const totalIncome=income[0]?.total||0,totalExpense=expense[0]?.total||0; res.json({totalIncome,totalExpense,balance:totalIncome-totalExpense}); } catch(e){ res.status(500).json({error:e.message}); }});
router.get('/history', async (req,res)=>{ try { res.json(await Transaction.find().populate('studentId','name rollNo').sort({date:-1})); } catch(e){ res.status(500).json({error:e.message}); }});
module.exports=router;