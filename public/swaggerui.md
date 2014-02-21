
# Swagger-UI Modifications


Although every effort has been made to use the Swagger UI without modification there are times where they are needed. This page was created to keeps tracks of the modifications made to each version used.  


## Current Version 2.0.13 (21-Feb-2014)

swagger-ui.js line 1170
Changed td width from 15% to 20% deal with font-size issue

swagger-ui.js line 331
Changed "Response Class" to "Response Object" makes more sense for HAPI.js



## Old Version 2.0.10 (17-Feb-2014)

swagger.js line 829
This changes stops the word undefined been passed as a value if inputs are left empty.

    // hapi-swagger 0.1.5
    if(args[param.name] !== undefined){
      if(queryParams !== ''){
        queryParams += "&";
      }
      queryParams += encodeURIComponent(param.name) + '=' + encodeURIComponent(args[param.name]);
    }

swagger-ui.js line 1170
Changed td width from 15% to 20% deal with font-size issue

swagger-ui.js line 331
Changed "Response Class" to "Response Object" makes more sense for HAPI.js