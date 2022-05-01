const express = require('express');
const bodyParser=require("body-parser");
const ejs=require('ejs');
const mongoose=require('mongoose');
const fs = require('fs');
const path = require('path');
const multer=require('multer')
const encrypt=require('mongoose-encryption');
const session=require('express-session');
const passport = require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const jwt = require('jsonwebtoken');
const app=express();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
// app.use(express.json());

app.use(session({
  secret:"Deepak badhe is genius",
  resave:false,
  saveUninitialized:false
}));
// app.use(bodyParser.json());


app.use(passport.initialize());
app.use(passport.session());
// app.use(flash());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology: true });
mongoose.set("useCreateIndex",true);

// -------------------- SET STORAGE ENGINE

const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname)) ;
    }
});

const upload=multer({
  storage:storage
}).single('img');

const userSchema=new mongoose.Schema({
  // name:String,
  // number:String,
  username:String,
  password:String,
  address:String
  // image:{
  //   type:String
  // },
  // Vehicletype:String
});

const vehicalSchema=new mongoose.Schema({
	image:String
});

userSchema.plugin(passportLocalMongoose);

const Vehical=new mongoose.model("Vehical",vehicalSchema);
const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/",function(req,res){
    res.render("home");
});
app.get("/signup",function(req,res){
	res.render("signup1");
});
app.get("/login",function(req,res){
	res.render("login1");
});
//
// app.get("/home",function(req,res){
//   res.redirect("/");
// });
app.get("/VehicleDetails",function(req,res){
	if(req.isAuthenticated()){
		User.findById(req.user.id,function(err,founduser){
			res.render("VehicleDetails");
			// res.render("VehicleDetails",{image:founduser.image});
		});
  }
});

app.get("/VehiclesDisplay",function(req,res){
	// Vehicle.find(,function(err,founndimage){
	// 	res.render("vehiclesdisplay",{image:foundimage.image});
	// });
  Vehical.find({
    "image":{
      $ne:null
    }
  },function(err,foundImage){
    if(err){
      console.log(err);
    }
    else{
      if(foundImage){
        res.render("vehiclesdisplay",{deepak:foundImage});
      }
    }
  });
	// res.render("vehiclesdisplay",{image:req.user.image});
});

app.get("/aboutus",function(req,res){
  res.render('aboutus');
});
app.get("/contact",function(req,res){
  res.render("contact");
});

app.get("/afterlogin",function(req,res){
	if(req.isAuthenticated()){
    res.render("afterlogin");
  }
  else{
    res.redirect("/");
  }
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.post("/signup",function(req,res){
  if(req.body.password===req.body.confirm){
    User.register({username:req.body.username},req.body.password,function(err,user){
  		if(err){
  			console.log(err);
  			res.redirect('/');
  		}
  		else{
  			passport.authenticate("local")(req,res,function(){
  				// console.log(passport);
  				res.redirect("/afterlogin");
  			});
  		}
  	});
  }
  else{
    console.log(req.body.confirm);
    const user=new User({
      username:req.body.username,
      password:req.body.password
    });
    req.login(user,function(err){
      if(err){
        console.log(err);
      }
      else{
        passport.authenticate("local")(req,res,function(){
          res.redirect("/afterlogin");
        });
      }
    });
  }
});
//
// app.post("/login", function(req,res){
//
// });

app.post("/afterlogin", function(req,res){
  const user=new User({
    username:req.body.email,
    password:req.body.password
  });
req.login(user,function(err){
  if(err){
    console.log(err);
  }
  else{
    passport.authenticate("local",function(req,res){
      console.log(req.body);
      res.redirect("/afterlogin",tokenForUser(admin));
    });
  }
});
});

app.post("/afterlogin/dataupdated",function(req,res){
  upload(req,res,(err) =>{
    if(err){
      console.log(err);
    }
    else{
       // console.log(req.file);
      User.findById(req.body.id,function(err,founduser){
        if(err){
          console.log(err);
        }
        else{
					const veh=new Vehical({
						_id:req.user.id,
						image:'/uploads/'+req.file.filename
					});
					veh.save();
          User.updateOne({"_id":req.user.id},{$set:{address:req.body.add,Vehicletype:req.body.vehicletype,image:'/uploads/'+req.file.filename}},function(err,req){
            	res.redirect("/afterlogin");
          });
         }
      });
    }
  });

});

app.listen(3000,function(){
  console.log("Server started at port 3000");
});

// app.post("/afterlogin",function(req,res){
//   const username=req.body.email;
//   const password=req.body.password;
//
//   User.findOne({email:username},function(err, foundUser){
//     if(err){
//         console.log(err);
//     }
//     else{
//       if(foundUser){
//           if(foundUser.password===password){
//             // alert("Successfully logged in");
//             res.render("afterlogin");
//           }
//           else{
//             // res.render("login",{val:2});
//
//             res.send('Invalid user');
//             // res.redirect("/");
//           }
//       }
//       else{
//           // res.render("login",{val:1});
//           res.redirect("/");
//       }
//     }
//   });
// });

//
//
//
// const email=req.body.email;
// const password=req.body.password;
//
// User.findOne({username:email},function(err,founduser){
// 	if(err){
// 		console.log(err);
// 		res.redirect('/');
// 	}
// 	else if(founduser){
// 		res.redirect('/');
// 	}
// 	else{
// 		const newUser = new User({
// 			username: email,
// 			password: password
// 		 });
//
// 		newUser.save(function (err) {
// 			if (err) {
// 				return next(err);
// 			} else {
// 				console.log(req.body);
// 				res.redirect('/afterlogin',token:tokenForUser(newUser));
// 			}
// 		});
// 	}
// });
