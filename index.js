var Horseman = require('node-horseman');
var TelegramBot = require('node-telegram-bot-api');
var fs = require('fs');


var startURL = 'http://coko.tomsk.ru/exam2017/res_exams.aspx';
var res = '';
var users = {};


    // Устанавливаем токен, который выдавал нам бот.
var token = '381283332:AAFx4YhdfDhzG5Yv_eeoplMcn3jdnXYiJhc';
// Включить опрос сервера
var bot = new TelegramBot(token, {polling: true});

fs.readFile('users.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  console.log(data);
  users = JSON.parse(data);
  console.log(Object.keys(users).length);
});

bot.onText(/\/subscribe ([\S]+)\s([\d]+)\s([\d]+)/, function (msg, match) {
	var fromId = msg.from.id;
	bot.sendMessage(fromId, 'Подождите немного, мы сверяемся с картотекой...');
	users[fromId] =  {"name": match[1], "seria": match[2], "num": match[3], "lastres": ""};
	var horseman = new Horseman();
	  horseman
		.on('error', console.error)
		.open(startURL)
		.type('input[name="ctl00$LastName"]', users[fromId].name)
		.type('input[name="ctl00$Seria"]', users[fromId].seria)
		.type('input[name="ctl00$Number"]', users[fromId].num)
		.click('[name="ctl00$LoginButton"]')
		.waitForNextPage()
		.open('http://coko.tomsk.ru/exam2017/res_exams.aspx')
		.waitForNextPage()
		 .html('[id="ctl00_ContentPlaceHolder1_ResExams"]')
		  .then(function(body) {
			re = /<\/tr><tr>/ig
			res = body.split(re);
			var ans = '';
			for(var i = 1; i < res.length; i++)
			{
				var str = res[i].replace(/<nobr>/g, "").replace(/<\/nobr>/g, "");
				var strs = str.match(/text-align:center">[^<]+<\/td>/ig);
				ans += strs[0].slice(19, -5) + " | Вариант - " + strs[1].slice(19, -5) + " | Балл - " + strs[2].slice(19, -5) + " | Результат - " + strs[3].slice(19, -5) + "\n";
				ans += "----------------\n";
			}		
			users[fromId].lastres = ans;
			fs.writeFile("users.txt", JSON.stringify(users), function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("The file was saved!");
			});
			bot.sendMessage(fromId, 'Подписка оформлена! Ваши текущие результаты:\n----------------\n' + users[fromId].lastres);
			return horseman.close();
		  })
		  .catch(function(e){
			bot.sendMessage(fromId, 'Упс, что-то пошло не так. Попробуйте чуть позже.');
		  });
});

bot.onText(/\/results/, function (msg, match) {
  var fromId = msg.from.id;
	try {
		bot.sendMessage(fromId, 'Минуточку...');
		var horseman = new Horseman();
		  horseman
			.on('error', console.error)
			.open(startURL)
			.type('input[name="ctl00$LastName"]', users[fromId].name)
			.type('input[name="ctl00$Seria"]', users[fromId].seria)
			.type('input[name="ctl00$Number"]', users[fromId].num)
			.click('[name="ctl00$LoginButton"]')
			.waitForNextPage()
			.open('http://coko.tomsk.ru/exam2017/res_exams.aspx')
			.waitForNextPage()
			 .html('[id="ctl00_ContentPlaceHolder1_ResExams"]')
			  .then(function(body) {
				re = /<\/tr><tr>/ig
				res = body.split(re);
				var ans = '';
				for(var i = 1; i < res.length; i++)
				{
					var str = res[i].replace(/<nobr>/g, "").replace(/<\/nobr>/g, "");
					var strs = str.match(/text-align:center">[^<]+<\/td>/ig);
					ans += strs[0].slice(19, -5) + " | Вариант - " + strs[1].slice(19, -5) + " | Балл - " + strs[2].slice(19, -5) + " | Результат - " + strs[3].slice(19, -5) + "\n";
					ans += "----------------\n";
				}
				users[fromId].lastres = ans;
				fs.writeFile("users.txt", JSON.stringify(users), function(err) {
					if(err) {
						return console.log(err);
					}
					console.log("The file was saved!");
				});
				
				bot.sendMessage(fromId, ans);
				/*					fs.writeFile("res.txt", strs, function(err) {
					if(err) {
						return console.log(err);
					}

			console.log("The file was saved!");
		});*/
		 
				console.log(res);
				
				return horseman.close();
			  })
			  .catch(function(e){
				bot.sendMessage(fromId, 'Упс, что-то пошло не так. Попробуйте чуть позже.');
			  });
	  }
	  catch(err) {
		bot.sendMessage(fromId, 'Упс, что-то пошло не так. Попробуйте чуть позже.');
	  }
});

bot.onText(/\/help/, function (msg, match) {
	var fromId = msg.from.id;
	bot.sendMessage(fromId, 'Список команд:\n/subscrbe <Фамилия> <Серия паспорта> <Номер паспорта> - если хочешь оформить подписку на обновления езультатов. Не бойся, кредит брать на тебя не буду 😉\n/results - если хочешь немедленно получить текущие результаты экзаменов\n/unsubscribe - если хочешь отписаться\n/help - если забыл список команд 😊');
});

bot.onText(/\/unsubscribe/, function (msg, match) {
	var fromId = msg.from.id;
	delete users[fromId];
	fs.writeFile("users.txt", JSON.stringify(users), function(err) {
		if(err) {
			return console.log(err);
		}
		console.log("The file was saved!");
	});
	bot.sendMessage(fromId, 'Эххх, ладно, пока! Если что - пиши 😊');
});

setInterval(function(){
	var i = 0;
	for (var key in users)
	{
		setTimeout(function(){
			var horseman = new Horseman();
		  horseman
			.on('error', console.error)
			.open(startURL)
			.type('input[name="ctl00$LastName"]', users[key].name)
			.type('input[name="ctl00$Seria"]', users[key].seria)
			.type('input[name="ctl00$Number"]', users[key].num)
			.click('[name="ctl00$LoginButton"]')
			.waitForNextPage()
			.open('http://coko.tomsk.ru/exam2017/res_exams.aspx')
			.waitForNextPage()
			 .html('[id="ctl00_ContentPlaceHolder1_ResExams"]')
			  .then(function(body) {
				re = /<\/tr><tr>/ig
				res = body.split(re);
				var ans = '';
				for(var i = 1; i < res.length; i++)
				{
					var str = res[i].replace(/<nobr>/g, "").replace(/<\/nobr>/g, "");
					var strs = str.match(/text-align:center">[^<]+<\/td>/ig);
					ans += strs[0].slice(19, -5) + " | Вариант - " + strs[1].slice(19, -5) + " | Балл - " + strs[2].slice(19, -5) + " | Результат - " + strs[3].slice(19, -5) + "\n";
					ans += "----------------\n";
				}
				if(users[key].lastres != ans)
				{
					users[key].lastres = ans;
					fs.writeFile("users.txt", JSON.stringify(users), function(err) {
						if(err) {
							return console.log(err);
						}
						console.log("The file was saved!");
					});
					
					bot.sendMessage(parseInt(key), 'Появились новые результаты!\n----------------\n' + ans);
				}
				
				return horseman.close();
			  })
			  .catch(function(e){
			  });
		}, i*10000);
		i++;
	}
}, Object.keys(users).length * 10000 + 30000); 
