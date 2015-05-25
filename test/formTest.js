var express = require("express");
var ejs = require('ejs');
var forms = require('forms');
var fields = forms.fields;
var widgets = forms.widgets;


var fooForm = forms.create({
	'name' : fields.url({
		label : '节目名称'
	}),
	'logo' : fields.url({
		label : '上传图片',
		widget : widgets.file()
	})
});

var app = express();
app.engine('.html', ejs.__express);
app.set('view engine', 'html');

app.get('/', function (req, res) {
	res.render('form.html',{
		form : fooForm.toHTML()
	});
});

app.post('/', function (req, res){
	fooForm.handle(req, {
		success : function (form) {
			console.log("success : " + JSON.stringify(form.data));
		},
		other : function (form) {
			console.log("other :" + JSON.stringify(form.data));
		}
	});
});


app.listen(3001);