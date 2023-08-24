const axios = require('axios');
const yes24 = require('./scraping/yes24');
const kyobo = require('./scraping/kyobo');

module.exports = {
  searchBookList: async (keyword, page = 1, maxResults = 10) => {
    try {
      const QueryType = 'Title';
      const searchTarget = 'Book';
      const output = 'js';
      const version = '20131101';

      const response = (await axios.get('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx', {
        params: {
          ttbkey: process.env.TTBKey,
          Query: keyword,
          QueryType,
          MaxResults: maxResults,
          start: page,
          SearchTarget: searchTarget,
          output,
          Version: version,
        },
      })).data;

      return response;
    } catch (err) {
      console.error(err.message);
    }
  },

  getBookDetail: async (isbn) => {
    // 책 정보 크롤링
    const detail = {};

    // 각 사이트 itemId 조회
    // promiss all로 수정하자
    const itemId = {
      yes24: await yes24.getInfo(isbn),
      kyobo: await kyobo.getInfo(isbn),
      aladin: detail.itemId,
      interpark: '',
    }

    return {detail, itemId};
  },

  getMemberReview: async (itemId, page, sort) => {
    const memberReview = itemId ? await yes24.getMemberReview(itemId, page, sort) : {};
    return memberReview;
  },

  getOneLineComment: async (itemId, page, sort) => {
    const oneLineComment = itemId ? await yes24.getOneLineComment(itemId, page, sort) : {};
    return oneLineComment;
  },

  getKloverReview: async (itemId, page, pageLimit, sort) => {
    const kloverReview = itemId ? await kyobo.getKloverReview(itemId, page, pageLimit, sort) : {};
    return kloverReview;
  }
}