import React from 'react';
import "./DeleteTuple.css";

import CheckDependency from './CheckDependency';

/**
 * list of allowed states on this delete tuple component
 */
type deleteTupleState = {
  dependencies: Array<any>, // list of dependencies fetched from API
  deleteStatusMessage: string, // for GUI to show
  isGettingDependencies: boolean, // for loading animation status
  isDeletingEntry: boolean // for loading animation status
}

class DeleteTuple extends React.Component<{token: string, selectedSchemaName: string, selectedTableName: string, tupleToDelete?: any, fetchTableContent: any, clearEntrySelection: any}, deleteTupleState> {
  constructor(props: any) {
    super(props);
    this.state = {
      dependencies: [],
      deleteStatusMessage: '',
      isGettingDependencies: false,
      isDeletingEntry: false
    }
  }

  /**
   * Check if new table selection has been made
   * @param prevProps 
   * @param prevState 
   */
  componentDidUpdate(prevProps: any, prveState: any) {
    // return if there has been no change in tuple selection
    if (prevProps.tupleToDelete === this.props.tupleToDelete) {
      return
    } else {
      // if there has been a change, close any error message
      this.setState({deleteStatusMessage: ''})
    }
  }

  /**
   * Function to delete the selected table entry after user is presented with potential dependencies and confirms
   * @param entry
   */
  handleTupleDeletion(entry: any) {
    let processedEntry = entry[0]?.primaryEntries // TODO: again, assuming component is only assuming 1 staged entry

    // set status true for deleting entry, switch to false once api responds
    this.setState({isDeletingEntry: true})

    // TODO: Run api fetch for list of dependencies/permission
    fetch('/api/delete_tuple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.props.token },
      body: JSON.stringify({schemaName: this.props.selectedSchemaName, tableName: this.props.selectedTableName, restrictionTuple: processedEntry})
    })
      .then(result => {
        // set deleting status to done
        this.setState({isDeletingEntry: false, dependencies: []})

        // Check for error mesage 500, if so throw error - shouldn't happen as often once real dependency check is in place
        if (result.status === 500) {
          throw Error(`${result.status} - ${result.statusText}`)
        }
        
        // return result - expecting a Delete Succesful string
        return result.text()
      })
      .then(result => {
        this.setState({deleteStatusMessage: result});

        // clear staged entry upon successful delete
        this.props.clearEntrySelection();

        // update table content reflecting the successful delete
        this.props.fetchTableContent();

      })
      .catch(error => {
        this.setState({deleteStatusMessage: error.message});
      })
  }

  /** store the returned list of dependencies
   *  @param list // list of dependencies that CheckDependency component returns
   */
  handleDependencies(list: Array<any>) {
    this.setState({dependencies: list})
  }

  render() {
    return(
      <div className="deleteWorkZone">
        <div className="tupleToDeleteCheck">
          {Object.values(this.props.tupleToDelete).map((entry: any) => {
            return (
              <div key={entry}>
                <p className="confirmationText">Delete this entry?</p>
                <table className="tupleToDelete">
                  <thead>
                    <tr>
                    {Object.keys(entry?.primaryEntries).map((primaryKey: any) => {
                      return (<th key={primaryKey} className="primaryKey">{primaryKey}</th>)
                    })}
                    {Object.keys(entry?.secondaryEntries).map((secondaryKey: any) => {
                      return (<th key={secondaryKey} className="secondaryKey">{secondaryKey}</th>)
                    })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                    {Object.values(entry?.primaryEntries).map((primaryVal: any) => {
                      return (<td key={primaryVal} className="primaryEntry">{primaryVal}</td>)
                    })}
                    {Object.values(entry?.secondaryEntries).map((secondaryVal: any) => {
                      return (<td key={secondaryVal} className="secondaryEntry">{secondaryVal}</td>)
                    })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>

        {Object.entries(this.props.tupleToDelete).length === 0 && !Object.entries(this.state.dependencies).length ? <p>Select a table entry to delete.</p> :
          <CheckDependency token={this.props.token} 
                          selectedSchemaName={this.props.selectedSchemaName}
                          selectedTableName={this.props.selectedTableName}
                          tupleToCheckDependency={Object.values(this.props.tupleToDelete)}
                          clearList={!Object.entries(this.state.dependencies).length} 
                          dependenciesReady={(depList: Array<any>) => this.handleDependencies(depList)} />
        }
        {this.state.dependencies.length ? (
          <div>
            <p>Are you sure you want to delete this entry?</p>
            <div className="actionButtons">
              <button className="confirmAction" onClick={()=>this.handleTupleDeletion(Object.values(this.props.tupleToDelete))} >Confirm Delete</button>
              <button className="cancelAction" onClick={() => {this.setState({dependencies: []}); this.props.clearEntrySelection();}}>Cancel</button>
            </div>
          </div>
        ): ''}
        <div className="deleting">
        {this.state.isDeletingEntry ? <p>Deleting entry might take a while...</p>: '' } {/* TODO: replace with proper animation */}
        {this.state.deleteStatusMessage ? (
          <div className="errorMessage">{this.state.deleteStatusMessage}<button className="dismiss" onClick={() => this.setState({deleteStatusMessage: ''})}>dismiss</button></div>
        ) : ''}
        </div>
      </div>
    )
  }
  
}

export default DeleteTuple;