'use strict';
const path = require('path');
const oElectron = require('electron');
const BrowserWindow = oElectron.remote.BrowserWindow;

//Main page class
function Screen () {
	
	this.oGrid = ko.observable(null);
	
	this.ipc = oElectron.ipcRenderer;
	this.sSourceFolder = '';
	
	this.init();
}

Screen.prototype.init = function ()
{
	var self = this;
	
	this.ipc.on('selected-directory', function (event, path) {
		
		this.sSourceFolder = path[0];
		EventEmitter.send('project-open', {
			'folder': path[0]
		});
	});
	
	EventEmitter.on('project-open', function(event, oData) {
		self.fill(JSON.parse(oData));
	});
};

Screen.prototype.fill = function (oData)
{
	this.oGrid(new Grid(oData));
	
	var 
		oSharedObject = oElectron.remote.getGlobal('sharedObject'),
		aLanguagesList = this.oGrid().headers()
	;
	
	if (!_.isEmpty(aLanguagesList))
	{
		oSharedObject['languages_list'] = aLanguagesList;
	}
};

Screen.prototype.openProject = function ()
{
	console.log('openProject');
	
	this.ipc.send('open-file-dialog');
};

Screen.prototype.saveProject = function ()
{
	var oData = this.oGrid().getData();
	var oResponse = EventEmitter.send('project-save', JSON.stringify(oData));
};

Screen.prototype.fillHoles = function ()
{
	console.log('fillHoles');
	this.oGrid().fillHoles();
};

Screen.prototype.addRow = function ()
{
	console.log('addRow');
	this.oGrid().addRow();
};

Screen.prototype.removeRow = function ()
{
	console.log('removeRow');
	
	if (confirm('Are you sure to remove selected row?'))
	{
		this.oGrid().removeRow();
	}
};

Screen.prototype.addColumn = function ()
{
	const modalPath = path.join('file://', __dirname, 'modal.html')
	
	let win = new BrowserWindow({ width: 400, height: 275, autoHideMenuBar: true})
	let self = this

	win.on('close', function () { 
		win = null;
		
		var oSharedObject = oElectron.remote.getGlobal('sharedObject');

		if (oSharedObject['create_language'])
		{
			self.oGrid().addColumn(oSharedObject['create_language'], oSharedObject['source_language']);
		}
	});
	win.loadURL(modalPath);
	win.show();
};

Screen.prototype.removeColumn = function ()
{
	const modalPath = path.join('file://', __dirname, 'remove-modal.html')
	
	let win = new BrowserWindow({ width: 400, height: 275, autoHideMenuBar: true})
	let self = this

	win.on('close', function () { 
		win = null;
		
		var oSharedObject = oElectron.remote.getGlobal('sharedObject');

		if (oSharedObject['remove_language'])
		{
			self.oGrid().removeColumn(oSharedObject['remove_language']);
		}
	});
	win.loadURL(modalPath);
	win.show();
	
};