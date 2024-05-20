var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
const { response } = require('../app');
/* GET users listing. */
router.get('/', function (req, res, next) {
    productHelper.getAllProduts().then((products)=>{
    res.render('admin/view-products',{admin:true,products})
  })

 
});     

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
        res.render("admin/add-products")
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
  res.render('admin/edit-products',{product})
}) 
});
router.post('/edit-products/:id',(req,res)=>{
  console.log(req.params.id)
  productHelper.editProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    let image=req.files.image
    image.mv('./public/product-images/'+req.params.id+'.jpg')
      }) 
})
   

module.exports = router;
