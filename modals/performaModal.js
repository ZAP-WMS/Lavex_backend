const mongoose=require('mongoose');
var valid = require('validator');
const performaSchema=mongoose.Schema({
    clientDetail:{
        t:{
         type:String,
         default:'Proforma'
        },
        client:{
            type:String,
            required:[true,'client is required'],
        
           },
           address:{
            type:String,
            required:['true','address is required']
           },
           city:{
            type:String,
            required:['true','city is required']
           },
           country:{
            type:String,
            required:[true,'country is required']
           },
           stateCode:{
            type:String,
            required:[true,'state code is required']
           }
        
    
       },
       porfarmaDetail:{
        porfarmaNo:{
            type:String,
            required:[true,'invoice no is required'],
            
        },
        invoiceDate:{
            type:String,
            required:[true,'invoice date is required']
        },
        dueDate:{
            type:String,
            required:[true,'due date is required']
    
        },
        maturityDate:{
            type:String,
            required:[true,'maturity date is required']
    
        },
        poNo:{
            type:String,
           // unique:true,
            required:[true,'po no is requ']     
            
           },
           
        cashAccounting:{
            type:Boolean,
            required:[true,'cashaccounting is required']
        }
    
       },
       shippedDetail:{
          toShipped:{
            type:String,
            required:[true,'to shipped detail is required']
          },
          forToShipped:{
            type:String,
            required:[true,"for to shipped is required"]
          }
    
       },
       gstRegistration:{
        type:Boolean,
        required:[true,'you should tell about gst registration(true or false)']
  
     },
     gstNumber:{
        type:String,
        default:null
     },
     individual:{
        type:Boolean,
        required:[true,'you should tell about individual(true or false)']
  
     },
     shortCode:{
        type:String,
        default:null
     },
     gstRegistration:{
        type:Boolean,
        required:[true,'you should tell about gst registration(true or false)']
  
     },
     gstNumber:{
        type:String,
        default:null
     },
       
       selectCurrency:{
        type:String,
        enum:['IndianCurrency','pakistanCurrency','nepalCurrency'],
        required:[true,'type of currency is required']
      },
     
      
      item:[{
         name:{
            type:String,
            required:[true,'name of item is required'],
         },
         brand:{
            type:String,
            required:[true,'name of brand is required'],
         },
         quantity:{
            type:Number,
            required:[true,'quantity  is required'],
            
         },
         gst:{
            type:Number,
            required:[true,'gst  is required'],
            
         },
         price:{
            type:Number,
            required:[true,'quantity  is required'],
            
         }
    
      }]
      
     
   
  



})
module.exports=mongoose.model('Performa',performaSchema)