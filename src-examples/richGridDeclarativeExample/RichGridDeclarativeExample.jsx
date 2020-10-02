import React, {Component} from "react";
import {AgGridColumn, AgGridReact} from "@ag-grid-community/react";
import RowDataFactory from "./RowDataFactory";
import ErrorRowDataFactory from "./ErrorRowDataFactory";
import DateComponent from "./DateComponent.jsx";
import SkillsCellRenderer from './SkillsCellRenderer.jsx';
import NameCellEditor from './NameCellEditor.jsx';
import ProficiencyCellRenderer from './ProficiencyCellRenderer.jsx';
import RefData from './RefData';
import SkillsFilter from './SkillsFilter.jsx';
import ProficiencyFilter from './ProficiencyFilter.jsx';
import HeaderGroupComponent from './HeaderGroupComponent.jsx';
import SortableHeaderComponent from './SortableHeaderComponent.jsx';
import * as _ from "lodash";
import "./RichGridDeclarativeExample.css";
// for enterprise features
import {AllModules} from "@ag-grid-enterprise/all-modules";

// for community features
// import {AllCommunityModules} from "@ag-grid-community/all-modules";

export default class RichGridDeclarativeExample extends Component {
    constructor(props) {
        super(props);
        this.selectedRows= new Set();
        this.state = {
            quickFilterText: null,
            sideBar: false,
            rowData: new ErrorRowDataFactory().createRowData(),
            waiversRegex : new ErrorRowDataFactory().getWaiversRegex(),
            rowCount: null,
            icons: {
                columnRemoveFromGroup: '<i class="fa fa-times"/>',
                filter: '<i class="fa fa-filter"/>',
                sortAscending: '<i class="fa fa-long-arrow-alt-down"/>',
                sortDescending: '<i class="fa fa-long-arrow-alt-up"/>',
                groupExpanded: '<i class="far fa-minus-square"/>',
                groupContracted: '<i class="far fa-plus-square"/>'
            },
            waivers :""
        };
    }

    /* Grid Events we're listening to */
    onGridReady = (params) => {
        this.api = params.api;
        this.columnApi = params.columnApi;

        this.api.sizeColumnsToFit();

        this.calculateRowCount();
    };

    onCellClicked = (event) => {
        console.log('onCellClicked: ' + event.data.name + ', col ' + event.colIndex);
    };

    onRowSelected = (event) => {
        console.log('onRowSelected: ' + event.node.data.familyname);

        if(event.node.isSelected()) {
            console.log("adding selection:"+ event.rowIndex);
            this.selectedRows.add(event.rowIndex);  
        }
        else {
            console.log("Removing from selection:" + event.rowIndex);
            this.selectedRows.delete(event.rowIndex);
        }
    };

    /* Demo related methods */
    onToggleSidebar = (event) => {
        this.setState({sideBar: event.target.checked});
    };

    deselectAll() {
        this.api.deselectAll();
        this.selectedRows.clear();
    }

    generateWaivers = ()=> {
        let waiver =  "";
        let cellNameMap = {};
        let pinNameMap ={};

        if (!this.selectedRows || this.selectedRows.size === 0) {
            waiver = "********* SELECT ROWS TO GENERATE WAIVER *******";
            this.setState({waivers: waiver});
            return;
        }
        this.selectedRows.forEach(element => {
            const rowD = this.state.rowData[element];
            const allDrives = rowD.all_drives;
            const allDriveArr = allDrives && allDrives.split(',')
            const allDriverReg = _.isEmpty(allDriveArr)?"" : "_.("+allDriveArr.join('|') +")";
            
            if (cellNameMap[rowD.error_code] != undefined) {
                cellNameMap[rowD.error_code]+= "|"+rowD.familyname+ allDriverReg;
                pinNameMap[rowD.error_code] += "|"+rowD.percentage;
            }else {
                cellNameMap[rowD.error_code]= rowD.familyname + allDriverReg;
                pinNameMap[rowD.error_code] = rowD.percentage;
            }
        });
        const waivers = this.state.waiversRegex;
        for( var key in cellNameMap) {
            const regex = waivers[key]
            waiver += "\n\n"+regex.replaceAll("%CELL_NAME%", cellNameMap[key]).replaceAll("%PIN%",pinNameMap[key] );
        };
        
        this.setState({waivers: waiver});
    }

    onQuickFilterText = (event) => {
        this.setState({quickFilterText: event.target.value});
    };

    onRefreshData = () => {
        this.setState({
            rowData: new ErrorRowDataFactory().createRowData(),
            waiversRegex : new ErrorRowDataFactory().getWaiversRegex()
        });
    };

    invokeSkillsFilterMethod = () => {
        this.api.getFilterInstance('skills', (instance) => {
            let componentInstance = instance.getFrameworkComponentInstance();
            componentInstance.helloFromSkillsFilter();
        });
    };

    dobFilter = () => {
        this.api.getFilterInstance('dob', (dateFilterComponent) => {
            dateFilterComponent.setModel({
                type: 'equals',
                dateFrom: '2000-01-01'
            });

            // as the date filter is a React component, and its using setState internally, we need
            // to allow time for the state to be set (as setState is an async operation)
            // simply wait for the next tick
            setTimeout(() => {
                this.api.onFilterChanged();
            });
        });
    };

    calculateRowCount = () => {
        if (this.api && this.state.rowData) {
            const model = this.api.getModel();
            const totalRows = this.state.rowData.length;
            const processedRows = model.getRowCount();
            this.setState({
                rowCount: processedRows.toLocaleString() + ' / ' + totalRows.toLocaleString()
            });
        }
    };

    static countryCellRenderer(params) {
        if (params.value) {
            return `<img border='0' width='15' height='10' style='margin-bottom: 2px' src='http://flags.fmcdn.net/data/flags/mini/${RefData.COUNTRY_CODES[params.value]}.png'> ${params.value}`;
        } else {
            return null;
        }
    }

    static dateCellRenderer(params) {
        return RichGridDeclarativeExample.pad(params.value.getDate(), 2) + '/' +
            RichGridDeclarativeExample.pad(params.value.getMonth() + 1, 2) + '/' +
            params.value.getFullYear();
    }

    static pad(num, totalStringSize) {
        let asString = num + "";
        while (asString.length < totalStringSize) asString = "0" + asString;
        return asString;
    }

    render() {
        return (
            <div style={{width: '100%'}}>
                <h1>QABuilder Error Report</h1>
                <p></p>
                <p></p>
                <div style={{marginTop: 10}}>
                    <div>
                        <span>
                            <button onClick={() => {
                                this.api.selectAll();
                            }} className="btn btn-primary">Select All</button>
                            <button onClick={() => {
                                this.deselectAll();
                            }} className="btn btn-primary">Clear Selection</button>
                            <button onClick={this.onRefreshData} className="btn btn-primary">Refresh Data</button>
                        </span>
                    </div>
                    <div style={{display: "inline-block", width: "100%", marginTop: 10, marginBottom: 10}}>
                        <div style={{float: "right", marginLeft: 20}}>
                            <label htmlFor="quickFilter">Quick Filter:&nbsp;</label>
                            <input type="text" id="quickFilter" onChange={this.onQuickFilterText}
                                   placeholder="Type text to filter..."/>
                        </div>
                    </div>
                    <div style={{height: 650, width: '100%'}} className="ag-theme-alpine">
                        <AgGridReact
                            // listening for events
                            onGridReady={this.onGridReady}
                            onRowSelected={this.onRowSelected}
                            onCellClicked={this.onCellClicked}
                            onModelUpdated={this.calculateRowCount}

                            // binding to simple properties
                            sideBar={this.state.sideBar}
                            quickFilterText={this.state.quickFilterText}

                            // binding to an object property
                            icons={this.state.icons}

                            // binding to array properties
                            rowData={this.state.rowData}

                            // register all modules (row model, csv/excel, row grouping etc)
                            modules={AllModules}

                            // no binding, just providing hard coded strings for the properties
                            // boolean properties will default to true if provided (ie suppressRowClickSelection => suppressRowClickSelection="true")
                            suppressRowClickSelection
                            rowSelection="multiple"
                            groupHeaders

                            // setting grid wide date component
                            dateComponentFramework={DateComponent}

                            // setting default column properties
                            defaultColDef={{
                                resizable: true,
                                sortable: true,
                                filter: true,
                                headerComponentFramework: SortableHeaderComponent,
                                headerComponentParams: {
                                    menuIcon: 'fa-bars'
                                }
                            }}>
                            <AgGridColumn headerName="#" width={40}
                                          checkboxSelection sortable={false} suppressMenu filter={false} pinned/>
                            <AgGridColumn headerName="Family Name" field="familyname" width={150}
                                              cellEditorFramework={NameCellEditor}
                                              enableRowGroup enablePivot pinned editable/>                                            
                             <AgGridColumn headerName="Error Code" field="error_code" width={150}
                                              cellEditorFramework={NameCellEditor}
                                              filterParams={{
                                                  cellRenderer: RichGridDeclarativeExample.countryCellRenderer,
                                                  cellHeight: 20
                                              }}
                                              enableRowGroup enablePivot pinned editable/>
                            <AgGridColumn headerName="Failed Drives" field="fail_drives" width={150}
                                              cellEditorFramework={NameCellEditor}
                                              filterParams={{
                                                  cellRenderer: RichGridDeclarativeExample.countryCellRenderer,
                                                  cellHeight: 20
                                              }}
                                              enableRowGroup enablePivot pinned/>
                            <AgGridColumn headerName="All Drives" field="all_drives" width={150}
                                              cellEditorFramework={NameCellEditor}
                                              filterParams={{
                                                  cellRenderer: RichGridDeclarativeExample.countryCellRenderer,
                                                  cellHeight: 20
                                              }}
                                              enableRowGroup enablePivot pinned/>
                            <AgGridColumn headerName="%Percentage Fail" field="percentage" width={150}
                                              cellEditorFramework={NameCellEditor}
                                              filterParams={{
                                                  cellRenderer: RichGridDeclarativeExample.countryCellRenderer,
                                                  cellHeight: 20
                                              }}
                                              enableRowGroup enablePivot pinned/>
                            <AgGridColumn headerName="Statis" field="status" width={150}
                                              cellEditorFramework={NameCellEditor}
                                              filterParams={{
                                                  cellRenderer: RichGridDeclarativeExample.countryCellRenderer,
                                                  cellHeight: 20
                                              }}
                                              enableRowGroup enablePivot pinned/>
                        </AgGridReact>
                    </div>
                    <div>
                        <br></br>
                        <span>
                            <button onClick={() => {
                                this.generateWaivers();
                            }} className="btn btn-primary">Generate Waivers</button>
                            <br></br>
                            <p></p>
                            <span><b>REGEX:</b></span>
                            <textarea rows="6" style={{ marginTop: "10px", width : "100%"}}  ref="waiverText" value={this.state.waivers}/>
                        </span>
                    </div>
                </div>
            </div>
        );
    }
}
