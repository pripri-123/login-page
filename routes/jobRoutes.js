const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// Home Page
router.get('/', async (req, res) => {
  const jobs = await Job.find({});
  res.render('index', { jobs });
});

// Post Job Page
router.get('/post-job', (req, res) => {
  res.render('post-job');
});

// Handle Job Posting
router.post('/post-job', async (req, res) => {
  const { title, description, payment, location } = req.body;
  const newJob = new Job({ title, description, payment, location });
  await newJob.save();
  res.redirect('/');
});

// Browse Jobs Page
router.get('/browse-jobs', async (req, res) => {
  const jobs = await Job.find({});
  res.render('browse-jobs', { jobs });
});

// Job Details Page
router.get('/job/:id', async (req, res) => {
  const job = await Job.findById(req.params.id);
  res.render('job-details', { job });
});

// Accept Job
router.post('/job/:id/accept', async (req, res) => {
  const { acceptedBy } = req.body;
  await Job.findByIdAndUpdate(req.params.id, { acceptedBy });
  res.redirect(`/job/${req.params.id}`);
});

module.exports = router;