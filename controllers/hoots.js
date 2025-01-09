// controllers/hoots.js
const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Hoot = require('../models/hoot.js');
const router = express.Router();

// ========== Public Routes ===========

// ========= Protected Routes =========

router.use(verifyToken);

router.post('/', async (req, res) => {
  try {
    req.body.author = req.user._id;
    const hoot = await Hoot.create(req.body);
    hoot._doc.author = req.user;
    res.status(201).json(hoot);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get('/', async (req, res) => {
  try {
    const hoots = await Hoot.find({})
      .populate('author')
      .sort({ createdAt: 'desc' });
    res.status(200).json(hoots);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/:hootId', async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId).populate('author');
    res.status(200).json(hoot);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.put('/:hootId', async (req, res) => {
  try {
    // Find the hoot:
    const hoot = await Hoot.findById(req.params.hootId);

    // Check permissions:
    if (!hoot.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    // Update hoot:
    const updatedHoot = await Hoot.findByIdAndUpdate(
      req.params.hootId,
      req.body,
      { new: true }
    );

    // Append req.user to the author property:
    updatedHoot._doc.author = req.user;

    // Issue JSON response:
    res.status(200).json(updatedHoot);
  } catch (error) {
    res.status(500).json(error);
  }
});


router.delete('/:hootId', async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId);

    if (!hoot.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId);
    res.status(200).json(deletedHoot);
  } catch (error) {
    res.status(500).json(error);
  }
});



router.put('/:hootId/comments/:commentId', async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId);
    const comment = hoot.comments.id(req.params.commentId);
    comment.text = req.body.text;
    await hoot.save();
    res.status(200).json({ message: 'Ok' });
  } catch (err) {
    res.status(500).json(err);
  }
});



router.post('/:hootId/comments', async (req, res) => {
  try {
    req.body.author = req.user._id;
    const hoot = await Hoot.findById(req.params.hootId);
    hoot.comments.push(req.body);
    await hoot.save();

    // Find the newly created comment:
    const newComment = hoot.comments[hoot.comments.length - 1];

    newComment._doc.author = req.user;

    // Respond with the newComment:
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.delete('/:hootId/comments/:commentId', async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId);
    hoot.comments.remove({ _id: req.params.commentId });
    await hoot.save();
    res.status(200).json({ message: 'Ok' });
  } catch (err) {
    res.status(500).json(err);
  }
});






module.exports = router;


// Why Can't You Use .populate() in POST and PUT Requests?
// .populate() Works on Query Results:
// .populate() is used when you're retrieving data from the database. It tells Mongoose to go into related collections (like User) and replace ObjectId references with the full document data.
// This happens when you're fetching data, such as in the GET request. You need the database to have the related documents first, so .populate() can work to "populate" the ObjectId with full data.
// In POST and PUT You're Working Before the Data is Saved:
// In the POST and PUT requests, you're creating or updating documents. The data you're working with has not yet been saved to the database.
// When creating a new document (in POST) or updating an existing one (in PUT), you’re either adding or modifying fields. In these cases, you're dealing with raw data—such as req.body, which contains the data that will be saved to the database.
// You Manually Set author in POST and PUT:
// In POST, before saving the Hoot, you manually set the author field to the logged-in user's ID (req.user._id). This ensures that the new hoot is associated with the correct user.
// In PUT, you also make sure that the author field remains tied to the user (who owns the hoot) before updating the document.
// These changes occur before the data is saved to the database, so there’s no need for .populate() at this point.
// Why Does .populate() Work in GET Requests?
// In GET, the data has already been saved. So when you query the hoots from the database (e.g., Hoot.find()), you already have an ObjectId stored in the author field.
// Now, when you use .populate('author'), it replaces the ObjectId with the actual User document, because Mongoose can now look up that ObjectId and replace it with the full User document.
// Recap of How Each Request Works:
// POST (Creating a New Hoot):
// You manually assign the current user's ID (req.user._id) to the author field of the req.body before saving it.
// This is before the data is saved to the database, so .populate() can't be used because no data is yet fetched from the database.
// PUT (Updating an Existing Hoot):
// Similar to POST, you're updating an existing hoot, and you want to ensure that the author is still the logged-in user (using req.user).
// Again, .populate() can’t be used here because you're working with data before it's saved.
// GET (Fetching Hoots):
// After the data is stored, when you fetch the data from the database, you use .populate('author') to replace the ObjectId reference in the author field with the full User document.
// Why You Need to Manually Assign req.user in POST and PUT:
// When you're creating or updating a Hoot, you want the author field to contain the full user data in the response, not just an ID.
// So, you manually assign the req.user object to the author field before sending the response (in the case of POST and PUT).
// This is why in POST and PUT requests, you don’t use .populate() but manually assign the author field. You need to work with the data before it is saved to the database, and .populate() can only work after data is fetched from the database.
// Summary:
// .populate() is for retrieving and replacing references (like ObjectId) with the full documents after they've been stored in the database.
// In POST and PUT, you're manipulating data before saving it, so you manually assign the author to ensure the response includes the full user data.





