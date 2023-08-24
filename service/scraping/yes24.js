const axios = require('axios');
const cheerio = require('cheerio');

async function getInfo(isbn){
  const itemList = await getList(isbn);
  const itemId = itemList.length ? await getItemId(isbn, itemList) : null;

  return itemId;
}

async function getList(isbn){
  const itemIdList = [];

  try {
    const response = (await axios.get('https://www.yes24.com/Product/Search', {
      params: {
        query: isbn,
        domain: 'ALL',
        page: 1,
        size: 100,  // 최대 120 인가
      },
    })).data;

    const $ = cheerio.load(response);

    $('a.gd_name').each((index, element) => {
      const hrefValue = $(element).attr('href');

      if (hrefValue.startsWith('/Product/Goods/')) {
        const itemId = hrefValue.split('/').reverse()[0];
        if (itemId) {
          itemIdList.push(itemId);
        }
      }
    });
  }catch (e) {
    console.error(e.message);
  }
  finally {
    return itemIdList;
  }
}

async function getItemId(isbn, itemIdList){
  for (const itemId of itemIdList) {
    const response = (await axios.get(`https://www.yes24.com/Product/Goods/${itemId}`)).data;
    const $ = cheerio.load(response);
    const itemIsbn = $('meta[property="books:isbn"]').attr('content');

    if (isbn === itemIsbn) {
      return itemId;
    }
  }
}

async function getMemberReview(itemId, page = 1, sort = 2) {
  //todo 회원리뷰는 이미지도 포함 가능
  const response = (await axios.get(`https://www.yes24.com/Product/CommunityModules/GoodsReviewList/${itemId}`, {
    params: {
      PageNumber: page,
      Sort: sort,
    },
  })).data;

  const $ = cheerio.load(response);

  // 리뷰 리스트
  // 1 페이지 = 리뷰 5개
  const pageLimit = 5

  const memberReviewList = $('.reviewInfoTop').map((index, element) => {
    const title = $(element).find('.review_tit .txt').text(); // 리뷰 제목
    const rating = $(element).find('.review_rating').text().trim().split('\n');
    const contentRating = rating[0].trim().match(/내용 평점(\d+)점/)[1];       // 내용 평점
    const designRating = rating[2].trim().match(/편집\/디자인 평점(\d+)점/)[1];  // 편집/디자인 평점
    const content = $(element).siblings('.reviewInfoBot.origin').find('.review_cont').text().trim();  //리뷰 내용
    const userId = $(element).find('.txt_id a').text().trim();  // 유저 아이디
    const date = $(element).find('.txt_date').text().trim();    // 작성 날짜
    const sympathy = $(element).siblings('.reviewInfoLike').find('.txt_sympathy').text().trim().match(/\d+/g);
    const sympathyCount = sympathy ? sympathy[0] : 0;  // 추천 수

    return {title, contentRating, designRating, content, userId, date, sympathyCount};
  }).get();

  // 총 회원 리뷰 수
  const scriptContent = $('script[type="text/javascript"]').html();
  const scriptPattern = /var reviewCountText = '(\d+)';/;
  const memberReviewCount = scriptContent.match(scriptPattern)[1];

  // 총 페이지 수
  const totalPage = Math.ceil(memberReviewCount / pageLimit);

  return {memberReviewList, memberReviewCount, page, totalPage};
}

async function getOneLineComment(itemId, page = 1, sort = 2) {
  const response = (await axios.get(`https://www.yes24.com/Product/communityModules/AwordReviewList/${itemId}`, {
    params: {
      PageNumber: page,
      Sort: sort,
    },
  })).data;

  const $ = cheerio.load(response);

  // 리뷰 리스트
  // 1 페이지 = 리뷰 6개
  const pageLimit = 6

  const oneLineCommentList = $('.cmtInfoBox').map((index, element) => {
    const rating = $(element).find('.cmt_rating').text().trim().match(/평점(\d+)점/)[1]; // 평점
    const content = $(element).find('.cmt_cont').text().trim();     // 리뷰 내용
    const userId = $(element).parent().find('.txt_id a').text().trim();  // 유저 아이디
    const date = $(element).parent().find('.txt_date').text().trim();    // 작성 날짜
    const sympathy = $(element).find('.txt_sympathy').text().trim().match(/\d+/g);
    const sympathyCount = sympathy ? sympathy[0] : 0;  // 추천 수

    return {rating, content, userId, date, sympathyCount}
  }).get();

  // 총 한줄평 수
  const scriptContent = $('script[type="text/javascript"]').html();
  const scriptPattern = /var totalCount = (\d+);/;
  const oneLineCommentCount = scriptContent.match(scriptPattern)[1];  // 응답 코드에서 이게 전체 개수라고 하네
  // const oneLineCommentCount = $('.gd_reviewTot em').text();        // 실제 개수는 이게 맞는데

  // 총 페이지 수
  const totalPage = Math.ceil(oneLineCommentCount / pageLimit);

  return {oneLineCommentList, oneLineCommentCount, page, totalPage};
}


module.exports = {getInfo, getMemberReview, getOneLineComment};