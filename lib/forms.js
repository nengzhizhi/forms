/*jslint node: true */
'use strict';

var async = require('async');
var is = require('is');
var http = require('http');
var querystring = require('qs');
var parse = require('url').parse;
var formidable = require('formidable');
var UUID = require('node-uuid');
var fs = require('fs');

exports.widgets = require('./widgets');
exports.fields = require('./fields');
exports.render = require('./render');
exports.validators = require('./validators');

exports.create = function (fields, opts) {
    if (!opts) { opts = {}; }
    //初始化文件临时上传路径
    opts.tmpDir = opts.tmpDir ? opts.tmpDir : './tmp';
    //初始化文件存放路径
    opts.uploadDir = opts.uploadDir ? opts.uploadDir : './files';
    //初始化文件访问路径，改值存储在数据库中
    opts.publicDir = opts.publicDir ? opts.publicDir : '/public/files';


    var validatePastFirstError = !!opts.validatePastFirstError;

    Object.keys(fields).forEach(function (k) {
        // if it's not a field object, create an object field.
        if (!is.fn(fields[k].toHTML) && is.object(fields[k])) {
            fields[k] = exports.fields.object(fields[k]);
        }
        fields[k].name = k;
    });
    var f = {
        fields: fields,
        bind: function (data) {
            var b = {};
            b.toHTML = f.toHTML;
            b.fields = {};
            Object.keys(f.fields).forEach(function (k) {
                if (data != null) {
                    b.fields[k] = f.fields[k].bind(data[k]);
                }
            });
            b.data = Object.keys(b.fields).reduce(function (a, k) {
                a[k] = b.fields[k].data;
                return a;
            }, {});
            b.validate = function (obj, callback) {
                if (arguments.length === 1) {
                    obj = callback;
                    callback = arguments[0];
                }

                async.forEach(Object.keys(b.fields), function (k, callback) {
                    b.fields[k].validate(b, function (err, bound_field) {
                        b.fields[k] = bound_field;
                        callback(validatePastFirstError ? null : err);
                    });
                }, function (err) {
                    callback(err, b);
                });
            };
            b.isValid = function () {
                var form = this;
                return Object.keys(form.fields).every(function (k) {
					var field = form.fields[k];
					if (is.fn(field.isValid)) { return field.isValid(); }
                    return field.error === null || typeof field.error === 'undefined';
                });
            };
            return b;
        },
        validateFile: function(file) {
            return true;
        },
        saveFiles: function (files) {
            var saves = {};
            for (var key in files) {
                if (!f.validateFile(files[key])) {
                    fs.unlinkSync(files[key].path);
                    saves[key] = null;
                } else {
                    var fileName = UUID.v1() + '.' + files[key].name.split('.')[1];
                    fs.renameSync(files[key].path, opts.uploadDir + '/' + fileName);
                    //fs.unlinkSync(files[key].path);
                    saves[key] = opts.publicDir + '/' + fileName;
                }
            }
            return saves;
        },
        handle: function (obj, callbacks) {
            if (typeof obj === 'undefined' || obj === null || (is.object(obj) && is.empty(obj))) {
                (callbacks.empty || callbacks.other)(f, callbacks);
            } else if (obj instanceof http.IncomingMessage) {
                if (obj.method === 'GET') {
                    var qs = parse(obj.url).query;
                    f.handle(querystring.parse(qs), callbacks);
                } else if (obj.method === 'POST' || obj.method === 'PUT') {
                    // If the app is using bodyDecoder for connect or express,
                    // it has already put all the POST data into request.body.
                    if (obj.body) {
                        f.handle(obj.body, callbacks);
                    } else {
                        var form = new formidable.IncomingForm();
                        //opts定义文件临时上传路径
                        console.log(opts.tmpDir);
                        form.uploadDir = opts.tmpDir;
                        form.parse(obj, function (err, fields, files) {
                            if (err) { throw err; }

                            var saves = f.saveFiles(files);
                            fields = querystring.parse(querystring.stringify(fields));

                            for (var key in saves) {
                                fields[key] = saves[key];
                            }

                            f.handle(fields, callbacks);
                        });
                    }
                } else {
                    throw new Error('Cannot handle request method: ' + obj.method);
                }
            } else if (is.object(obj)) {
                f.bind(obj).validate(function (err, f) {
                    if (f.isValid()) {
                        (callbacks.success || callbacks.other)(f, callbacks);
                    } else {
                        (callbacks.error || callbacks.other)(f, callbacks);
                    }
                });
            } else {
                throw new Error('Cannot handle type: ' + typeof obj);
            }
        },
        toHTML: function (name, iterator) {
            var form = this;

            if (arguments.length === 1) {
                name = iterator;
                iterator = arguments[0];
            }

            return Object.keys(form.fields).reduce(function (html, k) {
                var kname = is.string(name) ? name + '[' + k + ']' : k;
                return html + form.fields[k].toHTML(kname, iterator);
            }, '');
        }
    };
    return f;
};

