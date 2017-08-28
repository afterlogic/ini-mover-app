'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;

global.sharedObject = {
	'languages_list': [],
	'source_language': '',
	'create_language': '',
	'remove_language': ''
}

// require('electron-reload')('.', {
	// electron: require('electron-prebuilt')
// });

const _ = require('underscore');
const fs = require('fs');
// const ini = require('ini');
// const iniParser = require('iniparser');

var Config = require('conf-cfg-ini');
var config = new Config({
	'assignIdentifier': ' = '
});

function createWindow () {
	// Create the browser window.
	mainWindow = new electron.BrowserWindow({width: 800, height: 600, center: true, autoHideMenuBar: true});

	// and load the screen.html of the app.
	mainWindow.loadURL('file://' + __dirname + '/screen.html');

	// Open the DevTools.
	// mainWindow.webContents.openDevTools();
 
	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
}


var sOpenedFolder = '';

function getData (sDirPath) {
	var 
		aDir = fs.readdirSync(sDirPath),
		oFilesContent = {},
		oData = {
			'rows': {}
		}
	;
	
	sOpenedFolder = sDirPath;
	
	//read files
	if (!_.isEmpty(aDir))
	{
		_.each(aDir, function (sFileName) {
			if(sFileName.indexOf('.ini') === sFileName.length - 4){
				var oFile = readIniFile(sDirPath + '/' + sFileName);


				if (oFile)
				{
					oFilesContent[sFileName] = oFile;
				}
			}
		});
	}
	
	
	if (!_.isEmpty(oFilesContent))
	{
		oData = prepareData(oFilesContent);
	}
	
	return oData;
	
	/* return {
		'rows': {
			'CONST_TEST': 	{
				'English.ini': 'Test',
				'Russian': 'Проверка'
			},
			'CONST_ALT': {
				'English.ini': 'Alt',
				'Russian': 'Альтернатива'
			}
		}
	}; */
}

function saveData (oData) {
	var oFilesContent = {};
	if (!_.isEmpty(oData))
	{
		_.each(oData, function (oConstValues, sFullConstName) {
			
			var 
				aFullConstName = sFullConstName.split('/'),
				sSectionName = aFullConstName[1] ? aFullConstName[0] : '',
				sConstName = aFullConstName[1] || aFullConstName[0]
			;
			
			_.each(oConstValues, function(sValue, sFileName) {
				// sValue = '"' +JSON.stringify(sValue)+ '"';
				sValue = JSON.stringify(sValue).replace(/\\+(\\r|\\n|\\t)/g, '$1');
				
				if (!oFilesContent[sFileName])
				{
					oFilesContent[sFileName] = {};
				}
				
				if (sSectionName)
				{
					if(!oFilesContent[sFileName][sSectionName])
					{
						oFilesContent[sFileName][sSectionName] = {};
					}
					
					oFilesContent[sFileName][sSectionName][sConstName] = sValue;
				}
				else
				{
					oFilesContent[sFileName][sConstName] = sValue;
				}
			});
		});
	}
	
	if (!_.isEmpty(oFilesContent))
	{
		_.each(oFilesContent, function (oFile, sFileName) {
			// fs.writeFileSync(sOpenedFolder + '/_' + sFileName, ini.stringify(oFile, {
			fs.writeFileSync(sOpenedFolder + '/' + sFileName, config.encode(oFile, {
				'whitespace': true
			}));
		});
	}
}

function readIniFile (sPath) {
	// var oFileContent = ini.parse(fs.readFileSync(sPath, 'utf-8'));
	// var oFileContent = iniParser.parseString(fs.readFileSync(sPath, 'utf-8'));
	
	var raw = fs.readFileSync(sPath, 'utf-8');
	config.options.lineEnding = config.detectLineEnding(raw);

	//decode to get a simple js object
	var oFileContent = config.decode(raw);

	if (oFileContent)
	{
		return clearData(oFileContent);
	}
	
	return null;
}

function clearData (oFileContent) {
	return _.mapObject(oFileContent, function (sItem, sKey) {
		if (!_.isString(sItem))
		{
			return clearData(sItem);
		}
		else
		{
			while(sItem.substr(0, 1) === '"' || sItem.substr(0, 1) === ' ')
			{
				sItem = sItem.substr(1);
			}
			while ((sItem.substr(-1, 1) === '"' && sItem.substr(-2, 1) !== '\\') || sItem.substr(-1, 1) === ' ')
			{
				sItem = sItem.substr(0, sItem.length - 1);
			}

			sItem = sItem.replace(/(?:\")(:?\s*)\;.*$/g, '');
			// sItem = sItem.replace(/(?:\\(\"|\\|\?))/g, '$1');
			//sItem = sItem.replace(/^"|"$/g, '');
			sItem = sItem.replace(/(?:\\(\"|\\|\?))/g, '$1');

			var bInQuotes = sItem.substr(0, 1) === '"';

			return sItem;
		}
	});
}

function prepareData (oFilesContent) {
	var 
		oData = {
			'rows': {}
		}
	;
	
	_.each(oFilesContent, function (oFile, sFileName) {
	
		// _.each(oFile, function (oSection, sSectionName) {
		
			_.each(oFile, function (sConst, sConstName) {
				var 
					sFullConstName = sConstName
				;
				
				if (!oData.rows[sFullConstName])
				{
					oData.rows[sFullConstName] = {};
				}
					
				oData.rows[sFullConstName][sFileName] = sConst;
			});
		// });
	});
	
	return oData;
}

const EventEmitter = electron.ipcMain;
const dialog = require('electron').dialog;

EventEmitter.on('project-open', function(event, oRequest) {
	
	var oFilesData = getData(oRequest['folder']);
	event.sender.send('project-open', JSON.stringify(oFilesData));
});

EventEmitter.on('project-save', function(event, oRequest) {
	oRequest = JSON.parse(oRequest);
	if (oRequest['rows'] && saveData(oRequest['rows']))
	{
		oRequest['result'] = true;
		oRequest['message'] = 'Saved';
	}
	
	event.sender.send('project-save', oRequest);
});

//Directory select dialog
EventEmitter.on('open-file-dialog', function (event) {
	dialog.showOpenDialog({
		properties: ['openFile', 'openDirectory']
	}, function (files) {
		if (files) {
			event.sender.send('selected-directory', files);
		}
	});
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});