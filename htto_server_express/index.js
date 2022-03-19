const express = require('express');
const app = express();

const http = require('http');
const httpServer = http.createServer(app);
httpServer.listen(3000);

const bodyParser = require('body-parser');
app.use(bodyParser.json());
const fs = require('fs');

const path = require('path');
app.use(express.urlencoded({
    extended: true
}));


var messages = [];

// по подразбиране
app.get('/messages', function (request, response) {
  
    readData();

    // връща html страница
    return response.send(messages);
  
})

// добавя ново съобщение
app.post("/messages", function (request, response) {

    // създаваме новото съобщение с подадените данни
    const usrN = request.body.user;
    const mesS = request.body.message;

    const newMessage = {
        user: usrN,
        message: mesS
    }

    messages.push(newMessage);

    writeData();
  
    // връщаме съобщение за това ,че съобщението е добавено
    //return response.sendFile(path.join(__dirname+'/index.html'));
    return response.send(messages);
  
});

function writeData(){

    const data = JSON.stringify(messages);
  
    fs.writeFile('./messages.json', data, (err) => {
        if(err) {
            throw err;
        }
    });

}


function readData(){

    fs.readFile('./messages.json', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
  
        // parse JSON object
        const user = JSON.parse(data.toString());
        messages = user;
  
    });

}


// промяна на вече съсдадено съобщение
app.patch("/messages", function (request, response) {

  // извличаме данните от масива със съобщения в json формат и ги записваме в масиви от
  //  които можем да обходим след това
    const newMessages = Object.keys(messages).map((key) => [key, messages[key]]);
    var isPached = false;

  // създаваме итератор с когото да обходим масива със съобщения 
    let iterator = newMessages.values();

    const usrN = request.body.user;
    const mesSO = request.body.messageOld;
    const mesSN = request.body.messageNew;

    for(var data of iterator)
    {
      // проверяваме дали подаденото име на потребител съвпада с някое име от нашият масив 
      if(data[1].user == usrN)
      {
        if(data[1].message == mesSO){
        // ако намерим потребителя променяме съобщението
          data[1].message = mesSN;
          isPached = true;
        }
      }

    }


  // връщаме съобщение ,че сме редактирали съобщението
    if(isPached == true)
    {
      return response.send("<h3> променено е </h3>");
    }
    else
    {
      return response.send("<h3> не е променено </h3>");
    }

});


// изтрива съобщение по име на подател и съобщение
app.delete("/messages", function (request, response) {

    // извличаме данните от масива със съобщения в json формат и ги записваме в масиви от
    //  които можем да обходим след това
    const newMessages = Object.keys(messages).map((key) => [key, messages[key]]);
    var it = -1, currPosition = 0;

    // създаваме итератор с когото да обходим масива със съобщения
    let iterator = newMessages.values();

    const usrN = request.body.user;
    const mesS = request.body.message;

    for(const data of iterator)
    {
        // проверяваме дали подаденото име на потребител съвпада с име от нашият списък
        if(data[1].user == usrN)
        {
            if(data[1].message == mesS)
            {
                currPosition = it;
            }

        }

        it++;
    }


    // проверяваме дали е намерено съобщението и ако е така го изтриваме и извеждаме съобщение 
    if(it >= 0 ){
        messages.splice(currPosition + 1 , 1);
        response.send("<h3> премахнато съобщение </h3>");
    }
    else
    {
      response.send("<h3> не е премахнато съобщение </h3>");
    }



});

