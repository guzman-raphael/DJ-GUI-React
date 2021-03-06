import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEye, faEyeSlash, faSortAmountDown} from '@fortawesome/free-solid-svg-icons'
import TableType from '../TableTypeEnum/TableType'

/**
 * Parent Class for all table entry which mainly contains name and type of each table
 */
class TableListEntry {
  tableName: string;
  tableType: TableType;

  constructor(tableName: string, tableType: TableType) {
    this.tableName = tableName;
    this.tableType = tableType;
  }
}

/**
 * Parent Table List Entry Class which inherits TableListEntry but adds partTables array as an attribute
 */
class ParentTableListEntry extends TableListEntry {
  partTables: Array<PartTableListEntry>;

  constructor(tableName: string, tableType: TableType, partTables: Array<PartTableListEntry>) {
    super(tableName, tableType);
    this.partTables = partTables;
  }
}

/**
 * Part Table List Entry which inherits TableListEntry but set table type to PART by default
 */
class PartTableListEntry extends TableListEntry {
  constructor(tableName: string) {
    super(tableName, TableType.PART);
  }
}

type TableListState = {
  currentSort: string,
  viewAllPartTables: boolean,
  tablesToSort: any,
  hidePartTable: Array<string>,
  tableList: Array<ParentTableListEntry>
}

class TableList extends React.Component<{token: string, tableListDict: any, selectedTableName: string, selectedTableType: TableType, onTableSelection: any}, TableListState> {
  constructor(props: any) {
    super(props);
    this.state = {
      currentSort: 'tier',
      viewAllPartTables: true,
      tablesToSort: this.props.tableListDict,
      hidePartTable: [],
      tableList: [],
    }
  }

  toggleAllPartTableView() {
    // Controls visibility for all of the part tables in the list
    this.setState({viewAllPartTables: !this.state.viewAllPartTables})
    if (this.state.viewAllPartTables) {
      this.setState({hidePartTable: []})
    }
    
  }

  toggleEachPartTableView(table: any) {
    let updatedList = this.state.hidePartTable;
    if (this.state.hidePartTable.includes(table.tableName)) {
      let deleteIndex = updatedList.indexOf(table.tableName);
      updatedList.splice(deleteIndex, 1)
    } else {  
      updatedList.push(table.tableName)
    }

    this.setState({hidePartTable: updatedList})
    
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    // Check if the selectedSchemaBuffer is different if so than update the tableList
    if (prevProps.tableListDict === this.props.tableListDict) {
      return;
    }
  
    // Check if this.props.tableListDict is valid
    if (Object.keys(this.props.tableListDict).length === 0) {
      return;
    }

    // Parse the tableListDict and covert it to array form call tableList for rendering
    // Read through each part table, create the TableListEntry and store it cache it temporarly with the parent table as the key
    let partTableDict: Record<string, Array<PartTableListEntry>> = {};

    for (let partTableFullName of this.props.tableListDict['part_tables']) {
      const partTableNameSplitResult = partTableFullName.split('.');

      // Check if key already exist, if not initalize the array
      if (!(partTableNameSplitResult[0] in partTableDict)) {
        partTableDict[partTableNameSplitResult[0]] = [];
      }

      partTableDict[partTableNameSplitResult[0]].push(new PartTableListEntry(partTableNameSplitResult[1]));
    }

    // Parse through the rest of the table types of Computed, Manual, Imported and Lookup and attach Part table accordingly. Ignore all other type
    let tableListDictKeys: Array<string> = Object.keys(this.props.tableListDict);

    // Create a new tableList to later use for setState
    let tableList: Array<ParentTableListEntry> = [];

    // Remove part_tables entry from the key list
    tableListDictKeys.splice(tableListDictKeys.indexOf('part_tables'));

    // Looped through each type of table that is not part
    for (let tableTypeName of tableListDictKeys) {
      // Figure out what table type to be set
      let tableType = null;

      if (tableTypeName === 'computed_tables') {
        tableType = TableType.COMPUTED;
      }
      else if (tableTypeName === 'manual_tables') {
        tableType = TableType.MANUAL;
      }
      else if (tableTypeName === 'lookup_tables') {
        tableType = TableType.LOOKUP;
      }
      else if (tableTypeName === 'imported_tables') {
        tableType = TableType.IMPORTED;
      }
      else {
        throw Error('Unsupported table type: ' + tableTypeName);
      }

      // Iterate through the table name list and append part tables if the parent table name match
      for (let parentTableName of this.props.tableListDict[tableTypeName]) {
        // Check if parent table has parts table if so inserted
        if (parentTableName in partTableDict) {
          tableList.push(new ParentTableListEntry(parentTableName, tableType, partTableDict[parentTableName]));
        }
        else {
          tableList.push(new ParentTableListEntry(parentTableName, tableType, []));
        }
      }
    }

     // Update the state
     this.setState({tableList: tableList});
  }

  render() {
    return(
      <div className="table-menu">
        <div className="table-view-controls">
          <div className="sort-table-field">
            <div className="sort-field-head">
              <FontAwesomeIcon className="sort-icon" icon={faSortAmountDown} />
              <label>Sort<br />Table</label>
            </div>
            <select className="sort-table-options">
              <option value="tier">Tier</option>
              <option value="az">Alphabetical (A-Z)</option>
              {/* <option value="za">Alphabetical (Z-A)</option> */}
              {/* <option value="tb">Topological (top-bottom)</option> */}
              {/* <option value="bt">Topological (bottom-top)</option> */}
            </select>
          </div>
          <div className="view-all-part-tables">
            <div className="sort-field-head">
              <label>{this.state.viewAllPartTables ? 'Showing' : 'Hiding'} All Part Tables</label>
            </div>
            <div className="icon-container" onClick={() => this.toggleAllPartTableView()}>
              {this.state.viewAllPartTables ? <FontAwesomeIcon className="eye-icon" icon={faEye}/> : <FontAwesomeIcon className="eye-icon" icon={faEyeSlash}/>}
            </div>
          </div>
        </div>
        <div className="table-listing">
          {
            this.state.tableList.map((table: ParentTableListEntry) => {
              return(
                <div key={`${table.tableName}-${table.tableType}`}>
                  <div className={this.props.selectedTableName === table.tableName && this.props.selectedTableType === table.tableType ? 'table-entry selected' : 'table-entry'} key={`${table.tableName}-${table.tableType}`} onClick={() => {this.props.onTableSelection(table.tableName, table.tableType)}}>
                    <p className="table-name">{table.tableName}</p>
                    <span className={table.tableType === TableType.COMPUTED ? 'computed tier-label' : (table.tableType === TableType.LOOKUP ? 'lookup tier-label' : (table.tableType === TableType.MANUAL ? 'manual tier-label' : 'imported tier-label'))}>{TableType[table.tableType].toLowerCase()}</span>
                    {table.partTables.length ?
                      (<div onClick={() => {this.toggleEachPartTableView(table)}} className={table.tableType === TableType.COMPUTED ? "computed show-part-table" : table.tableType === TableType.IMPORTED ? "imported show-part-table" : table.tableType === TableType.LOOKUP  ? "lookup show-part-table" : "manual show-part-table"}>
                        <label className="head">part table</label>
                        <div className="icon">{!this.state.viewAllPartTables || this.state.hidePartTable.includes(table.tableName) ?
                          <FontAwesomeIcon className="eye-icon" icon={faEyeSlash} />
                          : <FontAwesomeIcon className="eye-icon" icon={faEye} />}
                        </div>
                      </div>) : ''}
                  </div>
                  {table.partTables.length && !this.state.hidePartTable.includes(table.tableName) ? (
                    table.partTables.map((partTable: PartTableListEntry) => {
                      return (
                        <div onClick={() => {this.props.onTableSelection(partTable.tableName, partTable.tableType)}} key={partTable.tableName} className={this.state.viewAllPartTables && this.props.selectedTableName === partTable.tableName && this.props.selectedTableType === partTable.tableType ? "part-table-entry selected" : this.state.viewAllPartTables && (this.props.selectedTableName !== partTable.tableName || this.props.selectedTableType !== partTable.tableType)? "part-table-entry" : !this.state.viewAllPartTables ? "part-table-entry hide" : ""}>
                        <p className="table-name">{partTable.tableName}</p>
                        <span className={table.tableType === TableType.COMPUTED ? "part-label computed-part" : table.tableType === TableType.LOOKUP ? "part-label lookup-part" : table.tableType === TableType.IMPORTED ? "part-label imported-part" : "part-label manual-part"}>
                          <div className="MT-type">{TableType[table.tableType].toLowerCase()}</div>
                          <div className="part-table-tag">{TableType[partTable.tableType].toLowerCase() + ' table'}</div>
                        </span>
                      </div>
                      )
                    })
                  ) : ''
                  }
                </div>
              )
            })
          }
        </div>
      </div>
    )
  }
}

export {TableList}