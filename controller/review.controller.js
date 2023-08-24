const express = require('express');
const router = express.Router();
const reviewService = require('../service/review.service')

router.get('/search', async (req, res) => {
  const {keyword, page, maxResults, sort} = req.query;
  const searchResults = await reviewService.searchBookList(keyword, page, maxResults, sort);

  return res.send(searchResults);
})

router.get('/detail/:isbn', async (req, res) => {
  const {isbn} = req.params;
  const bookDetail = await reviewService.getBookDetail(isbn);

  return res.send(bookDetail);
})

router.get('/review/yes24/:itemId/memberReview', async (req, res) => {
  const {itemId} = req.params;
  const {page, sort} = req.query;
  const memberReviews = await reviewService.getMemberReview(itemId, page, sort);

  return res.send(memberReviews);
})

router.get('/review/yes24/:itemId/oneLineComment', async (req, res) => {
  const {itemId} = req.params;
  const {page, sort} = req.query;
  const oneLineComments = await reviewService.getOneLineComment(itemId, page, sort);

  res.send(oneLineComments);
})

router.get('/review/kyobo/:itemId/kloverReview', async (req, res) => {
  const {itemId} = req.params;
  const {page, pageLimit, sort} = req.query;
  const kloverReviews = await reviewService.getKloverReview(itemId, page, pageLimit, sort);

  return res.send(kloverReviews);
})

router.get('/review/aladin/:itemId/', async (req, res) => {
  const {itemId} = req.params;
  const {page, pageLimit, sort} = req.query;
  const kloverReviews = await reviewService.getKloverReview(itemId, page, pageLimit, sort);

  return res.send(kloverReviews);
})

module.exports = router;