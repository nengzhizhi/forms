# Forms

在caolan/forms的基础上添加文件上传的功能，用于快速开发管理后台

## TODO list
1、暂时没有完成文件的检查
2、错误处理机制


##用法
创建表单:
```javascript
var forms = require('forms');

var fooForm = forms.create({
    'name' : fields.string({
        label : '节目名称'
    }),
    'logo' : fields.string({
        label : '上传图片',
        widget : widgets.file()
    })
});

完成上传后logo字段会存储文件的路径，此路径在使用时需要加上网络地址

##Bootstrap compatible output

function bootstrapField(name, object) {
    object.widget.classes = object.widget.classes || [];
    object.cssClasses = object.cssClasses || {label: ['control-label','col-sm-2']};
    if(object.widget.classes.indexOf('form-control') < 0 && object.widget.type != 'multipleCheckbox'){
        object.widget.classes.push('form-control');
    }

    var label = object.labelHTML(name);
    var error = object.error ? '<label class="control-label" style="float:left">' + object.error + '</label>' : '';

    var validationclass = '';
    validationclass = object.error ? 'has-error' : validationclass;

    var widget = object.widget.toHTML(name, object);

    if(object.widget.type == 'multipleCheckbox'){
        var html = 
                '<div class="form-group ' + validationclass + '">' + label + 
                '<div class="col-sm-4"><a href="#' + name + '" class="btn btn-primary form-control" data-toggle="collapse" aria-expanded="false" aria-controls="' + name + '">选择</a>' +
                '<div class="collapse" id="' + name + '" aria-expanded="false"><div class="well">' +
                widget +
                '</div></div></div></div>';
        return html;
    } else if (object.widget.type == 'file') {
        var html = 
                '<div class="form-group ' + validationclass + '">' + label + 
                '<div class="col-sm-4">' +
                  '<span class="btn btn-success form-control fileinput-button">' +
                      '<i class="glyphicon glyphicon-plus"></i>' +
                      '<span>选择文件..</span>' +
                      '<input id="' + name +'" name="' + name + '" type="hidden">' +
                      '<input id="' + object.options.buttonId + '" type="file">' +
                  '</span>' +              
                '</div>'  + error + '</div>' +
              '<div class="form-group">' +
                '<label for="id_name" class="control-label col-sm-2"></label>' +
                '<div class="col-sm-4">' +
                  '<div id="' + object.options.progressId + '" class="progress">' +
                      '<div class="progress-bar progress-bar-success progress-bar-striped"></div>' +
                  '</div>' +
                '</div>' + 
              '</div>';
        return html;
    } else {
        return '<div class="form-group ' + validationclass + '">' + label + '<div class="col-sm-4">' + widget + '</div>' + error + '</div>';    
    }
}