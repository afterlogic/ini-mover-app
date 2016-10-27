'use strict';

//Grid row class
function GridRow (oData, oParentGrid) {
	
	this.oData = oData;
	
	this.name = ko.observable(this.oData['name'] || 'UNDEFINED');
	this.values = ko.observableArray([]);
	this.active = ko.observable(false);
	this.renaming = ko.observable(false);
	this.dragging = ko.observable(false);
	this.oParentGrid = oParentGrid;
	this.init();
}

GridRow.prototype.init = function () {
	var aValues = [];

	if (!_.isEmpty(this.oData['values']))
	{
		_.each(this.oData['values'], function (sValue, sValueName) {
			aValues.push({
				'name': sValueName,
				'value': sValue
			});
		});
	}
	
	this.values(aValues);
};

GridRow.prototype.toggleActive = function (oItem, oEvent) {
	if (oEvent.target.tagName.toUpperCase() ===  'INPUT' || oEvent.target.className === 'row-name') {
		return false;
	}
	
	if (this.oParentGrid.renamingRow())
	{
		this.oParentGrid.renamingRow().renaming(false);
	}
	
	if (this.oParentGrid.selectedRow())
	{
		this.oParentGrid.selectedRow().active(false);
	}
	
	this.active(true);
	
	this.oParentGrid.selectedRow(this);
};

GridRow.prototype.toggleRenaming = function (oItem, oEvent) {
	oEvent.stopPropagation();
	console.log('toggleRenaming');
	if (this.oParentGrid.selectedRow())
	{
		this.oParentGrid.selectedRow().active(false);
	}
	
	
	if (this.oParentGrid.renamingRow())
	{
		this.oParentGrid.renamingRow().renaming(false);
	}
	
	this.renaming(true);
	
	this.oParentGrid.renamingRow(this);
};





