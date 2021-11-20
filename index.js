const express = require("express");
const app = express(); //새로운 express 앱을 만듦
const port = 3000;
//const bodyParser = require("body-parser");
const { User } = require("./models/User"); //내가 쓸 데이터베이스(회원 정보가 담긴)를 가져와야 함
const cookieParser = require("cookie-parser");
const config = require("./config/key");

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); //For JSON requests
app.use(cookieParser());

const mongoose = require("mongoose");
mongoose
  .connect(config.mongoURI)
  .then(() => {
    console.log("MongoDB Connected....");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("안녕 안녕 안녕!"); //응답인 hello world!를 보냄(화면에 나타남)
});

app.post("/register", (req, res) => {
  //회원 가입 할 때 필요한 정보들을 client에서 가져오면
  //그것들을 데이터 베이스에 넣어준다
  const user = new User(req.body); //데이터 베이스 인스턴스를 생성한다
  //app.use(express.urlencoded({ extended: true })); app.use(express.json()); //For JSON requests
  //덕분에 req.body에는 id, password,email등의 정보가 json형식으로 들어있다.
  user.save((err, userInfo) => {
    //만약 에러가 있었다면 응답으로 json형식으로 반환하자
    if (err) return res.json({ success: false, err });
    //에러 없이 성공적으로 저장했다면
    return res.status(200).json({
      success: true,
    }); //response의 status에 200을 저장
  }); //save는 mongoDB의 메서드
  //.save()를 함으로써 req.body에 담겨져 있던 json정보들이 User 데이터베이스(user 인스턴스)에 저장됨
});

app.post("/login", (req, res) => {
  //1. 요청된 이메일(유니크함, 기본키 역할)가 데이터베이스 안에 있는지 찾음
  //findOne은 mongodb의 메서드
  //요청 정보는 body에 담겨 있음
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      //해당되는 게 없을 때
      return res.json({
        success: false,
        message: "제공된 이메일이 해당되는 유저가 없습니다",
      });
    }

    //2. db에 해당 이메일이 있다면 비밀번호가 같은지 확인
    //models/User.js 안에 해당 함수를 해줘야 함
    user.comparePassword(req.body.password, (err, isMatch) => {
      //(models/User.js 참고) 콜백함수의 파라미터로 결과가 전달되므로
      if (!isMatch) {
        return res.json({
          loginSuccess: false,
          message: "비밀번호가 틀렸습니다",
        });
      }
      //3. 비밀번호까지 같다면 token을 생성
      //이것도 comparePassword 처럼 models/User.js에서 우리가 직접 메서드 만듦
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err); //우선 응답으로 status code 400d을 전달하고, 어떤 에러인지도 보내줌
        //성공시 이제 생성한 토큰을 저장한다. 어디에? 쿠키, 세션, 로컬 스토리지...
        //현재 User.js에서 내가 구현한 코드에 따라 현재 user에 token이 들어있음
        //일단 지금은 쿠키에 저장함
        res
          .cookie("x_auth", user.token)
          .status(200)
          .json({ loginSuccess: true, userId: user._id }); //x_auth라는 이름으로 토큰 값이 쿠키에 저장됨
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
