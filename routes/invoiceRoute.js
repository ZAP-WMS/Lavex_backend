const express = require('express')
const Invoice = require('../modals/invoiceModal')
const DeliveryChalan = require('../modals/deliveryChalan')
const Company = require('../modals/companyModal')
router = express.Router();
const { ProductionStore, ProductionStore2 } = require('./../modals/store/productionStore')
const SisterStore = require('../modals/sisterStore');
const SisterStock = require('../modals/sisterStock')
const Supplier = require('../modals/supplierModal')


router.get('/invoicesbyClient/:clientname', async (req, res) => {
  try {
    let result = await Invoice.aggregate([{ $match: { "clientDetail.client": req.params.clientname } },
    {
      $project: {
        "clientDetail.client": 1,
        "invoiceDetail.invoiceNo": 1,
        "invoiceDetail.dueDate": 1,
        calculatedAmount: {
          "$reduce": {
            "input": "$item",
            initialValue: 0,
            in: { $add: ["$$value", { $multiply: ["$$this.price", "$$this.qty", { $add: [1, { $divide: ["$$this.gst", 100] }] }] }] }
          }
        }
      }
    },
    {
      $project: {
        "invoiceAmount": "$calculatedAmount",
        "balanceAmount": "$calculatedAmount"
      }
    }


    ])

    if (result.length == 0) {
      res.send({
        message: "no invoice found for this client",
        success: false,
        data: null
      })

    }
    else {
      res.send({
        message: "invoice is fetched successfully fetched",
        success: true,
        data: result
      })
    }

  }
  catch (err) {
    res.send({
      message: err.message,
      success: false,
      data: null

    })
  }




})


router.post('/invoiceCreate', async (req, res) => {
  let { type, role } = req.query;
  let { item } = req.body
  let js = { ...req.body, companyname: type }

  let parr = []
  try {
    let body = req.body;
    let data = await Invoice.find({ companyname: type })
    let max = data.reduce((acc, curr) => curr.mov > acc ? curr.mov : acc, 0)
    max = max + 1;
    js.mov = max;
    let total = item.reduce((acc, curr) => acc + curr.price * curr.quantity * (1 + curr.gst / 100), 0)
    js.total = total;
    js.pendingAmount = total;
    let invoice = new Invoice(js);
    await invoice.save();
    req.body.selectDc.map(async (elem) => {

      await DeliveryChalan.findByIdAndDelete(elem)
    })
    if (req.body.selectDc.length == 0) {

      if (role == 'master') {
       
        for (let i = 0; i < item.length; i++) {
          let { id, quantity } = item[i];

          const f = await ProductionStore.updateOne(
            { readyStock: { $elemMatch: { id: id } } },
            { $inc: { "readyStock.$[elem].quantity": -quantity } },
            { arrayFilters: [{ "elem.id": id }] }
          );


        }


        const branch = req.body.clientDetail.Branch.trim().toUpperCase();
       
        let isSister = await Company.findOne({ Branch: branch })
       
        if (isSister) {
          let mascompany = await Company.findById(type)
          let s = await Supplier.findOne({ companyname: isSister._id, supplier: mascompany.company + ' ' + mascompany.Branch })

          if (!s) {
            let { Branch, company, address, area, email, state, gstNumber, pincode, panNumber, contactPerson, mobile1, mobile2, city, stateCode } = mascompany
            let js2 = { companyname: isSister._id, supplier: company + ' ' + Branch, address: address, email: email, area: area, state: state, gstNumber: gstNumber, pincode: pincode, panNumber: panNumber, contactPerson: company, mobile1: mobile1, mobile2: mobile2, city: city, stateCode: stateCode }
            let sup = new Supplier(js2);
            s = await sup.save()
           
          }
          //here i creating movenent for sister store
          let data2 = await SisterStore.find({ companyname: isSister._id })
         
          let max2 = data2.reduce((acc, curr) => curr.mov > acc ? curr.mov : acc, 0)
          max2 = max2 + 1;
        
          let js = {mov:max2,address: body.clientDetail.address, gstNumber: body.clientDetail.gstNumber, total: total, pendingAmount: total, sid: s._id, dateCreated: req.body.invoiceDetail.invoiceDate, companyname: isSister._id, readyStock: item }
          let sisterstore = new SisterStore(js)
          await sisterstore.save()
        }


      }
      else {

        console.log('hi i am sister compmany')
        for (let i = 0; i < item.length; i++) {
          let { id, quantity } = item[i];
          const f = await SisterStock.updateOne(
            { companyname: type, 'readyStock.id': id },
            { $inc: { "readyStock.$[elem].quantity": -quantity } },
            { arrayFilters: [{ "elem.id": id }] }
          );

        }
      }



    }
    res.send({
      message: "data is successfully added",
      success: true,

    })

  }
  catch (err) {
    res.send({
      message: err.message,
      success: false,



    })

  }
})

router.get('/invoice/:number/:name', async (req, res) => {
  console.log(req.params.number)
  try {
    let result = await Invoice.findOne({ $and: [{ "invoiceDetail.invoiceNo": req.params.number }, { companyname: req.params.name }] })
    if (result == null) {
      res.send({
        message: "please fill correct company name and invoiceNo"
      })

    }
    else {
      res.send({
        message: "invoice is fetched successfully attached",
        success: true,
        data: result
      })
    }

  }
  catch (err) {
    res.send({
      message: err.message,
      success: false,
      data: null

    })
  }

})
router.get('/getinvoice/:clientid/:name', async (req, res) => {
  console.log(req.params.number)
  try {
    let result = await Invoice.find({ $and: [{ "clientDetail.id": req.params.clientid }, { companyname: req.params.name }] })
    if (result.length == 0) {
      res.send({
        message: "no invoice is generated from this client",
        success: false
      })
    }
    else {
      res.send({
        message: "invoice is fetched successfully attached",
        success: true,
        data: result
      })
    }

  }
  catch (err) {
    res.send({
      message: err.message,
      success: false,


    })
  }

})
router.get('/allinvoices/:id', async (req, res) => {
  try {
    let result = await Invoice.find({ companyname: req.params.id })
    res.send({
      message: "invoice is fetched successfully fetched",
      success: true,
      data: result
    }
    )



  }
  catch (err) {
    res.send({
      message: err.message,
      success: false,
      data: null

    })
  }


})


router.get('/invoiceByProd', async (req, res) => {
  try {
    let { fromDate, toDate, type, companyname, prodId, id } = req.query;
    let model = type == 'invoice' ? Invoice : DeliveryChalan
    let query = { companyname: companyname }
    let data = await model.find(query)
    if (fromDate && toDate) {
      const [dayFrom, monthFrom, yearFrom] = fromDate.split('-');
      const [dayTo, monthTo, yearTo] = toDate.split('-');
      const from = new Date(`${yearFrom}-${monthFrom}-${dayFrom}`);
      const to = new Date(`${yearTo}-${monthTo}-${dayTo}`);
      console.log(from)
      console.log(to)
      data = data.filter(item => {
        const [day, month, year] = item.invoiceDetail.invoiceDate.split('-');
        let itemDate = new Date(`${year}-${month}-${day}`);
        
        return itemDate >= from && itemDate <= to;
      });

    }


    if (id) {
     
     data= data.filter(item => {
        return item.clientDetail.id == id
      })
    }

    if (prodId) {
     
      data=data.filter(elem => {
        /*let f=elem.item.find(elem2=>{
           return elem2.id==prodId
        })
      
        return f*/
        let index=elem.item.findIndex(elem2=>{
          return elem2.id==prodId
        })
        if(index>-1){
         const element = elem.item[index]; 
         elem.item.splice(0, elem.item.length); 
         elem.item.push(element);
         return true
         
        }
        else{
          elem.item.splice(index,1)
          return false

        }
      
      })

    }
    res.send({
      message: 'data is successfully fetched',
      success: true,
      data: data
    })
  }
  catch (err) {
    res.send({
      message: err.message,
      success: false,
      data: null
    })

  }


})

router.get('/salesReport',async(req,res)=>{
  try{

    let { fromDate, toDate, type, companyname } = req.query;
    let model = type == 'invoice' ? Invoice : DeliveryChalan
    let query = { companyname: companyname }
    let data = await model.find(query)
    if (fromDate && toDate) {
      
      const [dayFrom, monthFrom, yearFrom] = fromDate.split('-');
      const [dayTo, monthTo, yearTo] = toDate.split('-');
     
      const from = new Date(`${yearFrom}-${monthFrom}-${dayFrom}`);
      const to = new Date(`${yearTo}-${monthTo}-${dayTo}`);
      console.log(from)
      console.log(to)
      data = data.filter(item => {
        const [day, month, year] = item.invoiceDetail.invoiceDate.split('-');
        let itemDate = new Date(`${year}-${month}-${day}`);
        console.log(itemDate)
        return itemDate >= from && itemDate <= to;
      });

    }

    res.send({
      message: 'data is successfully fetched',
      success: true,
      data: data
    })

  

  }
  catch(err){
    res.send({
      message: err.message,
      success: false,
      data: null
    })

  }


})





module.exports = router