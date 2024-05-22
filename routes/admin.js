var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
const { response } = require('../app');
const { log } = require('handlebars');

const verifyAdmin=(req,res,next)=>{
  if(req.session.admin){
    next()
  }else{
    res.redirect('/admin')
  }
}
/* GET users listing. */
router.get('/', function (req, res, next) {
    res.render('admin/admin-login')
  })

  router.post('/admin-verify',(req,res)=>{
     console.log("REQ ADMN: ",req.body)
     productHelper.verifyAdmin(req.body).then((response)=>{
      if(response){
        console.log("ADMIN LOGINED")
        req.session.adminLogedIn=true
        req.session.admin=req.body.username
        productHelper.getAllProduts().then((products)=>{
          res.render('admin/view-products',{admin:true,adminName:req.body.username,products})
        })
      }else{
        req.session.adminLogedIn= false
        res.redirect('/admin')
      }

     })
  })

    

router.get('/add-products', function (req, res) {
  res.render('admin/add-products')

});


router.post('/add-products', (req, res) => {

  productHelper.addProduct(req.body,(id)=>{
    let image=req.files.image;
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
     if(err){
      console.log(err);
     }else{
        res.render("admin/add-products",{adminName:req.session.admin})
     }
    })
   })
  })
router.get('/delete-product/:id',(req,res)=>{
  let proId= req.params.id
  productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin')
  })   
});
router.get('/edit-products/:id', (req, res)=> {
  let proId=req.params.id
  productHelper.getProduct(proId).then((product)=>{
    console.log(product)
  res.render('admin/edit-products',{product,adminName:req.session.admin})
  })
  });
router.post('/edit-products/:id',(req,res)=>{
  console.log(req.params.id)
  productHelper.editProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    let image=req.files.image
    image.mv('./public/product-images/'+req.params.id+'.jpg')
      }) 
});

router.get('/all-orders',verifyAdmin,(req,res)=>{
  console.log("GETTING ALL ORDRS")
  productHelper.getAllOrders().then((allOrders)=>{
    res.render('admin/all-orders',{allOrders})
  })
  
})
   

module.exports = router;
