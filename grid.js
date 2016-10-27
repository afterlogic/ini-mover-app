'use strict';

//Grid class
function Grid (oData) {
	this.oData = oData;
	
	this.rows = ko.observableArray([]);
	
	this.headers = ko.observableArray([]);
	
	this.selectedRow = ko.observable(null);
	this.renamingRow = ko.observable(null);

	this.init();
}

Grid.prototype.init = function ()
{
	var 
		self = this,
		aRows = [],
		oRow,
		oRowDataDefault = {}
	;
	
	this.headers(this.getHeaders());
	
	_.each(this.headers(), function (sHeaderName) {
		oRowDataDefault[sHeaderName] = '';
	});
	
	if (!_.isEmpty(this.oData['rows']))
	{
		_.each(this.oData['rows'], function (oRowData, sRowName) {
			if (_.size(oRowData) !== self.headers().length) {
				oRowData = _.extend(_.clone(oRowDataDefault), oRowData);
			}
			oRow = new GridRow({
				'name': sRowName,
				'values': oRowData
			}, self);
			
			aRows.push(oRow);
		});
	}
	
	if (!_.isEmpty(aRows))
	{
		this.rows(aRows);
	}
};

Grid.prototype.getHeaders = function ()
{
	var aHeaders = [];
	
	if (!_.isEmpty(this.oData['rows']))
	{
		_.each(this.oData['rows'], function (oRowData, sRowName) {
			aHeaders = _.union(aHeaders, _.keys(oRowData));
		});
	}

	return aHeaders;
};

Grid.prototype.getData = function ()
{
	var 
		oData = {
			'rows': {}
		},
		oRowData
	;
	
	_.each(this.rows(), function (oRow) {
		if (!_.isEmpty(oRow.values()))
		{
			oRowData = {};
			
			_.each(oRow.values(), function (oValue) {
				oRowData[oValue.name] = oValue.value;
			});
			
			oData['rows'][oRow.name()] = oRowData;
		}
	});
	
	return oData;
};

Grid.prototype.fillHoles = function ()
{
	_.each(this.rows(), function (oRow) {
		var 
			sDefaultValue = '',
			sDefaultLanguage = 'English.ini',
			bFound = false,
			aValues = []
		;
		_.each(oRow.values(), function (oValue) {

			if (oValue.name === sDefaultLanguage) {
				sDefaultValue = oValue.value;
			}
			if (oValue.value === '') {
				bFound = true;
			}
		});
		
		if (bFound) {
			_.each(oRow.values(), function (oValue) {
				aValues.push({
					'name': oValue.name,
					'value': oValue.value === '' ? sDefaultValue :  oValue.value
				});
			});
			
			oRow.values(aValues);
		}
	});
};


Grid.prototype.addRow = function (oItem) {
	console.log('addRow');
	
	var oValues = {};
	
	_.each(this.headers(), function (sName) {
		oValues[sName] = '';
	});
	
	this.rows.push(
		new GridRow({
			'values': oValues
		}, this)
	);
};

Grid.prototype.removeRow = function () {
	var oItem = this.renamingRow() || this.selectedRow();
	
	this.rows.remove(oItem);
};

Grid.prototype.addColumn = function (sColumnName, sSourceColumnName) {

	sSourceColumnName = sSourceColumnName || 'English.ini';
	
	if (sColumnName)
	{
		this.headers.push(sColumnName);
		
		_.each(this.rows(), function (oRow) {
			var oValue = _.findWhere(oRow.values(), {'name': sSourceColumnName});
			
			if (oValue) {
				oValue = _.clone(oValue);
				oValue['name'] = sColumnName;
			}
			
			oRow.values.push(oValue);
		});
	}
};

Grid.prototype.removeColumn = function (sColumnName) {

	if (sColumnName)
	{
		this.headers.remove(sColumnName);
		
		_.each(this.rows(), function (oRow) {
			var oValue = _.findWhere(oRow.values(), {'name': sColumnName});
			
			if (oValue) {
				oRow.values.remove(oValue);
			}
			
		});
	}
};

Grid.prototype.dragStart = function (oItem) {
	oItem.dragging(true);
};

Grid.prototype.dragEnd = function (oItem) {
	oItem.dragging(false);
};

Grid.prototype.reorder = function (event, dragData, zoneData) {
	if (dragData !== zoneData.item) {
		var zoneDataIndex = zoneData.items.indexOf(zoneData.item);
		zoneData.items.remove(dragData);
		zoneData.items.splice(zoneDataIndex, 0, dragData);
	}
};






