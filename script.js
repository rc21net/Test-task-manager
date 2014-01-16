(function(){


$(function(){
	
	var app = new Controller();
	app.Run();
	
});	




function Task() {
	this.id;
	this.subject;
	this.priority;
	this.tag;
	this.complete;
}

Task.prototype.Create = function(task) {
	if (task && task.subject == '') return this;
	this.id = new Date().getTime();
	this.subject = task.subject;
	this.priority = task.priority || 2;
	this.tag = task.tag;
	this.complete = task.complete || false;
	return this;
};

Task.prototype.Load = function(key) {
	var stringTask = localStorage[key];
	if (stringTask == null) return;
	
	var objectTask = JSON.parse(stringTask);
	this.id = parseInt(objectTask.id);
	this.subject = objectTask.subject;
	this.priority = parseInt(objectTask.priority);
	this.tag = parseInt(objectTask.tag);
	this.complete = objectTask.complete ? true : false;
};

Task.prototype.Edit = function(task) {
	if (task && task.subject == '') return false;
	this.subject = task.subject;
	this.priority = task.priority || 2;
	this.tag = task.tag;
	this.complete = task.complete || false;
	return this;
};

Task.prototype.Save = function() {
	localStorage[this.id] = JSON.stringify(this);
};

Task.prototype.Remove = function() {
	localStorage.removeItem(this.id);
};




function Controller() {
	this.taskList = {};
	this.view;
	this.params = {};
	this.hasTouch = 'ontouchstart' in window;
	
}

Controller.prototype.Run = function() {
	if (!this.SupportCheck()) {
		console.log('The application is not supported by your browser');
		return false;
	}
	
	this.GetParams();
	
	this.view = new View(this.params.lang);
	$('body').append(this.view.Run());
	
	var taskCount = localStorage.length;
	
	for (var i=0; i<taskCount; i++) {
		var key = localStorage.key(i);
		this.taskList[key] = new Task();
		this.taskList[key].Load(key);
		this.AddTask(this.taskList[key]);
	}
	
	this
		.RunEvents()
		.Action();
	
};

Controller.prototype.Action = function() {
	var action = this.params.action;
	if (!action) return this;
	this[action+'Action']();
	return this;
};

Controller.prototype.addTaskAction = function() {
	this.NewTask($('button.new-task'));
};

Controller.prototype.editTaskAction = function() {
	var taskId = this.params.taskId;
	if (!taskId) return this;
	var taskView = $('#'+taskId);
	if (!taskView.length) return this;
	var elem = taskView.children('.edit');
	this.EditTask(elem);
};

Controller.prototype.deleteTaskAction = function() {
	var taskId = this.params.taskId;
	if (!taskId) return this;
	var taskView = $('#'+taskId);
	if (!taskView.length) return this;
	var elem = taskView.children('.delete');
	this.DeleteTask(elem);
};

Controller.prototype.GetParams = function() {
	if (!location.hash) return this;
	var params = location.hash.substring(1).split('&');
	for (var i=0; i<params.length; i++) {
		var pair = params[i].split('=');
		this.params[pair[0]] = pair[1];
	}
	return this;
};

Controller.prototype.AddTask = function(task) {
	var taskView = this.view.TaskItem(task);
	taskView.prependTo('.tasklist').hide().slideDown();
	this.TaskItemEvents(taskView);
};

Controller.prototype.ReplaceTask = function(task, replaced) {
	var t = this;
	
	var taskView = t.view.TaskItem(task);
	
	replaced.slideUp(400, function(){
		
	replaced.replaceWith(taskView.hide());
	taskView.slideDown();
	t.TaskItemEvents(taskView);
		
	});
};

Controller.prototype.CompleteTask = function(elem) {
	var taskView = elem.parent();
	var id = taskView.attr('id');
	taskView.toggleClass('completed');
	this.taskList[id].complete = taskView.hasClass('completed') ? true : false;
	this.taskList[id].Save();
};

Controller.prototype.DeleteTask = function(elem) {
	var taskView = elem.hasClass('delete') ? elem.parent() : elem;
	var id = taskView.attr('id');
	
	taskView.slideUp(400, function(){
	
	taskView.remove();
	
	});
	
	this.taskList[id].Remove();
	delete this.taskList[id];
	
};

Controller.prototype.EditTask = function(elem) {
	var t = this;
	var taskView = elem.parent();
	var id = taskView.attr('id');
	
	taskView.children().fadeOut(400, function(){
		
	var form = t.view.TaskForm(t.taskList[id]);
	form
		.appendTo(taskView.empty())
		.hide()
		.slideDown();
	
	t.TaskFormEvents(elem);
	
	form.find('.save').click(function(e){
		e.preventDefault();
		
		var subject = $('.subject-edit').val();
		if (!subject) return;
		
		t.taskList[id].Edit({
				subject: $('.subject-edit').val(),
				priority: $('.priority-bar button.current').data('value'),
				tag: $('.tags-bar button.current').data('value'),
				complete: $('.complete-bar button').hasClass('current') ? true : false
			})
			.Save();
		
		t.ReplaceTask(t.taskList[id], taskView);
	});
	
	form.find('.cancel').click(function(e){
		e.preventDefault();
		t.ReplaceTask(t.taskList[id], taskView);
	});
		
	});
};

Controller.prototype.NewTask = function(elem) {
	var t = this;
	
	elem.fadeOut(400,function(){
	
	var form = t.view.TaskForm();
	form
		.appendTo($('header').empty())
		.hide()
		.slideDown();
	
	t.TaskFormEvents(elem);
	
	form.find('.save').click(function(e){
		e.preventDefault();
		
		var subject = $('.subject-edit').val();
		if (!subject) return;
		
		var task = new Task();
		task.
			Create({
				subject: subject,
				priority: $('.priority-bar button.current').data('value'),
				tag: $('.tags-bar button.current').data('value'),
				complete: $('.complete-bar button').hasClass('current') ? true : false
			})
			.Save();
		t.taskList[task.id] = task;
		
		form.slideUp(400, function(){
		
		$('header').empty().append(elem.fadeIn());
		elem.click(function(){
			t.NewTask($(this));
		});
		
		t.AddTask(task);	
			
		});
	});
	form.find('.cancel').click(function(e){
		e.preventDefault();
		
		form.slideUp(400, function(){
		
		$('header').empty().append(elem.fadeIn());
		elem.click(function(){
			t.NewTask($(this));
		});
			
		});
		
	});
		
	});
	
	
};

Controller.prototype.TaskItemEvents = function(taskView) {
	var t = this;
	taskView.children('.complete').click(function(){
		t.CompleteTask($(this));
	});
	taskView.children('.edit').click(function(){
		t.EditTask($(this));
	});
	if (t.hasTouch) {
		taskView.on('drag', function(e){
			if (e.orientation == 'horizontal' && e.direction == -1 && e.adx > 200 && !$(this).find('.deleteConfirm-bar').length) {
				t.ConfirmDelete($(this));
			}
		});
	} else {
		taskView.children('.delete').click(function(e){
			e.preventDefault();
			t.ConfirmDelete($(this).parent());
		});
	}
};

Controller.prototype.ConfirmDelete = function(taskView) {
	var t = this;
	var bar = t.view.ConfirmDelete();
	bar
		.appendTo(taskView)
		.hide()
		.fadeIn();
	bar.children('.deleteConfirm').click(function(e){
		e.preventDefault;
		t.DeleteTask(taskView);
	});
	bar.children('.deleteCancel').click(function(e){
		e.preventDefault;
		bar.fadeOut(400, function(){
			bar.remove();
		});
	});
};

Controller.prototype.RunEvents = function() {
	var t = this;
	$('button.new-task').click(function(){
		t.NewTask($(this));
	});
	return this;
};

Controller.prototype.TaskFormEvents = function(elem) {
	$('.tags-bar button, .priority-bar button').click(function(e){
		e.preventDefault();
		$(this).parent().children().removeClass('current');
		$(this).addClass('current');
	});
	$('.complete-bar button').click(function(e){
		e.preventDefault();
		$(this).toggleClass('current');
	});
};

Controller.prototype.SupportCheck = function() {
	if (this._isStorage) return true;
	else return false;
};

Controller.prototype._isStorage = function() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
    	return false;
  	};
};




function View(lang) {
	this.lang = lang || 'en';
	this.localizations = {
		en: {
			newTask: 	'New task',
			tags: 		'Tags',
			priority: 	'Priority',
			completed: 	'Completed',
			save: 		'Save',
			cancel: 	'Cancel',
			high: 		'High',
			normal: 	'Normal',
			low: 		'Low',
			confirmDel: 'Delete'
		},
		ru: {
			newTask: 	'Новая задача',
			tags: 		'Метка',
			priority: 	'Приоритет',
			completed: 	'Завершена',
			save: 		'Сохранить',
			cancel: 	'Отмена',
			high: 		'Высокий',
			normal: 	'Обычный',
			low: 		'Низкий',
			confirmDel: 'Удалить'
		}
	};
	this.hasTouch = 'ontouchstart' in window;
}

View.prototype.Run = function () {
	var t = this;
	return $('<div class="application">' +
				'<header>' +
					'<button class="new-task">' + t.localizations[t.lang].newTask + '</button>' +
				'</header>' +
				'<section class="tasklist"></section>' +
			'</div>');
};

View.prototype.TaskItem = function(task) {
	var priority = task.priority == 2 ? '' : ' priority-'+task.priority;
	var tag = task.tag > 0 ? ' tag-'+task.tag : '';
	var complete = task.complete ? ' completed' : '';
	var checked = task.complete ? ' checked="checked"' : '';
	var deleteIcon = this.hasTouch ? '' : '<i class="icon delete"></i>';
	return $('<article class="task' + complete + '" id="' + task.id + '">' +
				'<input type="checkbox" class="complete"' + checked + ' />' +
				'<i class="icon priority' + priority + tag + '"></i>' +
				'<span class="subject">' + task.subject + '</span>' +
				'<i class="icon edit"></i>' +
				deleteIcon +
			'</article>');
};

View.prototype.TaskForm = function(task) {
	var t = this;
	var title = task ? '' : '<h2>' + t.localizations[t.lang].newTask + '</h2>';
	var id = task ? task.id : null;
	var subject = task ? task.subject : '';
	
	var tags = '';
	for (var i=0; i<6; i++) {
		var current = (task && task.tag == i) || (!task && i == 0)  ? ' current' : '';
		tags += '<button class="tag-' + i + current +'" data-value="' + i + '"></button>';
	}
	
	var priority = '';
	var priorityValue = [t.localizations[t.lang].high, t.localizations[t.lang].normal, t.localizations[t.lang].low];
	for (var i=1; i<4; i++) {
		var current = (task && task.priority == i) || (!task && i == 2)  ? ' class="current"' : '';
		priority += '<button data-value="' + i + '"' + current + '>' + priorityValue[i-1] + '</button>';
	}
	
	var complete = task ? (task.complete ? ' class="current"' : '') : '';
	
	return $('<form class="task-edit" data-id="' + id + '">' +
				title +
				'<textarea class="subject-edit">' + subject + '</textarea>' +
				'<div class="tags-bar">' +
					'<label>' + t.localizations[t.lang].tags + '</label>' +
						tags +
					'</div>' +
					'<div class="priority-bar">' +
						'<label>' + t.localizations[t.lang].priority + '</label>' +
						priority +
					'</div>' +
					'<div class="complete-bar">' +
						'<button' + complete + '></button>' +
						'<label>' + t.localizations[t.lang].completed + '</label>' +
					'</div>' +
					'<div class="action-bar">' +
						'<button class="save">' + t.localizations[t.lang].save + '</button>' +
						'<button class="cancel">' + t.localizations[t.lang].cancel + '</button>' +
					'</div>' +
				'</form>');
};

View.prototype.ConfirmDelete = function() {
	var t = this;
	return $('<div class="deleteConfirm-bar">' +
				'<button class="deleteConfirm">' + t.localizations[t.lang].confirmDel + '</button>'+
				'<button class="deleteCancel">' + t.localizations[t.lang].cancel + '</button>'+
			'</div>'
		);
};


})();