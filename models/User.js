const mongoose = require("mongoose"); //우선 mongoose 모듈 가져오기
const bcrypt = require("bcrypt");
//스키마 생성- mongoose의 Schema 메서드를 사용
const saltRounds = 10;

const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema({
  //필드명:  제한조건
  name: {
    type: String,
    maxlength: 50,
  },
  email: {
    type: String,
    trim: true, //여백(스페이스)을 없애줌
    unique: 1,
  },
  password: {
    type: String,
    minlength: 5,
  },
  lastname: {
    type: String,
    maxlength: 50,
  },
  role: {
    type: Number, //1이면 관리자, 0이면 일반 유저
    default: 0,
  },
  image: String,
  token: {
    type: String, //유효성 검사
  },
  tokenExp: {
    type: Number,
  },
});

//스키마.pre('save',함수);면 해당 스키마(의 객체)를 데이터베이스에 저장하기 전!에
//pre함수의 콜백함수를 진행한다는 것임
//즉 해당 콜백함수가 끝나고 나서 save함수가 진행될 수 있음
userSchema.pre("save", function (next) {
  let user = this; //this는 """userSchema의 해당 객체"""를 가르킴
  if (user.isModified("password")) {
    //비밀 번호를 암호화시킨다
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err); //만약에 에러가 응답으로 오면 걍 return시킴
      //성공했다면
      bcrypt.hash(user.password, salt, function (err, hash) {
        // 공식문서의 myPlaintextPassword는 암호화 전 그냥 순수한 비밀번호임- 따라서 그냥 user.password로 해줌
        //그리고 hash 함수의 콜백함수의 hash가 암호화된 비밀번호임
        if (err) return next(err); //에러 발생시
        //암호화된 비밀번호(hash) 만드는 데 성공함
        user.password = hash; //암호화된 것으로 paassword에 넣어줌
        next(); //모두 완료되면 index.js의 /register 라우터로 보낸다.
      });
    });
  } else {
    next(); //비밀번호 수정이 아니면 index.js의 /register 라우터로 보낸다.
  }
});

//내가 "직접" (멤버) 메서드 선언하고 구현.
//해당 메서드의 파라미터로 plainPassword와 콜백함수를 해줘야겠음
userSchema.methods.comparePassword = function (myPlainPassword, cb) {
  //plainPassword를 암호화했을 때 현재 db의 암호화된 비밀번호와 똑같이 나오는지 검사
  bcrypt.compare(myPlainPassword, this.password, function (err, isMatch) {
    if (err) return cb(err); //파라미터의 콜백함수로 결과 전달
    cb(null, isMatch); //파라미터의 콜백함수로 결과 전달
  });
};

userSchema.methods.generateToken = function (cb) {
  let user = this; //userSchema의 "객체"
  //jsonwebtoken 이용해서 token을 생성하기
  let token = jwt.sign(user._id.toHexString(), "secretToken"); //공식 문서//여기서 user._id는 mongoDB에 저장된 collection에서 각 document들이 고유하게 가지는 값
  //user._id와 'secretToken'을 합쳐서 token을 생성함!
  //그리고 필드에 만들어진 토큰 저장
  user.token = token;
  //그리고 db에 저장한다(token값을)
  user.save(function (err, user) {
    if (err) return cb(err); //만약 에러 발생시 generateToken의 파라미터인 cb로 결과 전달
    //에러 없으면
    cb(null, user);
  });
};

//그리고 이 스키마를 model로 감싸주고 이름을 정해주자
const User = mongoose.model("User", userSchema); // 즉 이 스키마를 쓸 데이터베이스(테이블)의 이름을 정해주자
//.model(이름, 사용할 스키마 이름);

//그리고 이 모델을 다른 파일에서도 쓸 수 있도록 export해줌
module.exports = { User };
