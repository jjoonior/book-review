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
    const response = (await axios.get('https://search.kyobobook.co.kr/search', {
      params: {
        keyword: isbn,
        gbCode: 'TOT',
        target: 'total',
      },
    })).data;

    const $ = cheerio.load(response);

    $('.prod_category').each((index, element) => {
      const hrefValue = $(element).parent().attr('href');

      if (hrefValue.startsWith('https://product.kyobobook.co.kr/detail/')) {
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
  // 교보는 헤더에 user-agent와 referer이 없으면 빈 응답값이 옴
  for (const itemId of itemIdList) {
    const response = (await axios.get(`https://product.kyobobook.co.kr/detail/${itemId}`,{
      headers: {
        'User-Agent': 'PostmanRuntime/7.32.3',  //todo axios/버전 으로 수정하자
        Referer: `https://product.kyobobook.co.kr/detail/${itemId}`
      }
    })).data;
    const $ = cheerio.load(response);
    const itemIsbn = $('meta[property="books:isbn"]').attr('content');

    if (isbn === itemIsbn) {
      return itemId;
    }
  }
}

async function getKloverReview(itemId, page = 1, pageLimit = 10, sort = '001') {
  const response = (await axios.get(`https://product.kyobobook.co.kr/api/review/list`, {
    //todo 헤더 위로 빼서 중복 없애자
    headers: {
      'User-Agent': 'PostmanRuntime/7.32.3',  //todo axios/버전 으로 수정하자
      Referer: `https://product.kyobobook.co.kr/detail/${itemId}`
    },
    params: {
      page,
      pageLimit,
      reviewSort: sort,
      revwPatrCode: '000',
      saleCmdtid: itemId
    },
  })).data;

  // 리뷰 리스트
  // 1 페이지 = 리뷰 10개 (고정 X)
  const kloverReviewList = response.data.reviewList.map(element => {
    const rating = element.revwRvgr;  // 리뷰 평점
    const content = element.revwCntt; // 리뷰 내용
    const userId = element.mmbrId;    // 유저 아이디
    const date = element.cretDttm;    // 작성 날짜
    const sympathyCount = element.reviewRecommendCount;  // 추천 수
    const imgCount = element.reviewAtacCount;   // 이미지 수
    const img = element.reviewAtacList.map(img => {   // 이미지 정보
      const imgPath = `https://contents.kyobobook.co.kr/${img.webLinkUrladrs}`; // 이미지 경로
      const imgSize = img.atacFileByteCont; // 이미지 크기(Byte)

      return {imgPath, imgSize};
    });

    return {rating, content, userId, date, sympathyCount, imgCount, img};
  })

  // 총 회원 리뷰 수
  const kloverReviewCount = response.data.totalCount;

  // 총 페이지 수
  const totalPage = Math.ceil(kloverReviewCount / pageLimit);

  return {kloverReviewList, kloverReviewCount, page, totalPage};
}

module.exports = {getInfo, getKloverReview};
