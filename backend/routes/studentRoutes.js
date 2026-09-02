const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

router.post('/add', async (req,res)=>{
  try { const student=await Student.create(req.body); res.status(201).json({message:'Student added successfully',student}); }
  catch(e){ res.status(400).json({error:e.message}); }
});

router.get('/list', async (req,res)=>{
  try { res.json(await Student.find().sort({rollNo:1})); }
  catch(e){ res.status(500).json({error:e.message}); }
});

router.get('/:id', async (req,res)=>{
  try { const student=await Student.findById(req.params.id); if(!student)return res.status(404).json({error:'Student not found'}); res.json(student); }
  catch(e){ res.status(400).json({error:e.message}); }
});

router.put('/:id', async (req,res)=>{
  try { const student=await Student.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}); if(!student)return res.status(404).json({error:'Student not found'}); res.json({message:'Student updated successfully',student}); }
  catch(e){ res.status(400).json({error:e.message}); }
});

router.delete('/:id', async (req,res)=>{
  try { const student=await Student.findByIdAndDelete(req.params.id); if(!student)return res.status(404).json({error:'Student not found'}); res.json({message:'Student deleted successfully'}); }
  catch(e){ res.status(400).json({error:e.message}); }
});

module.exports=router;