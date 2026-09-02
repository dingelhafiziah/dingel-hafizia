const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
router.post('/add', async (req,res)=>{ try { const student=await Student.create(req.body); res.status(201).json({message:'Student added successfully',student}); } catch(e){ res.status(400).json({error:e.message}); }});
router.get('/list', async (req,res)=>{ try { res.json(await Student.find().sort({rollNo:1})); } catch(e){ res.status(500).json({error:e.message}); }});
module.exports=router;