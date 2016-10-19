/**
 * Temboo JavaScript Library
 *
 * Execute Choreographies from the Temboo library, proxied via any
 * server-side Temboo SDK.
 *
 *
 * LICENSE: Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @module     Temboo
 * @version    JavaScriptSDK_2.18.1
 * @author     Temboo, Inc.
 * @copyright  2014 Temboo, Inc.
 * @license    http://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link       http://www.temboo.com
 */

(function() {

	var VERSION = 'JavaScriptSDK_2.18.1';

	/**
	 * A choregraphy and associated inputs for execution with a TembooProxy.
	 * Internal only. Use TembooProxy.addChoreo() to construct instead.
	 * @constructor
	 * @param {TembooProxy} proxy - A TembooProxy object.
	 * @param {string} name - The name of this choreography in the server-side Temboo Proxy whitelist.
	 * @param {Object.<string, string|number>} inputs - The key/value inputs for this choreography.
	 */
	var TembooProxiedChoreography = function(proxy, name, inputs) {
		
		var outputFilters;

		if(typeof inputs !== 'object') {
			inputs = {};
		}

		/**
		 * Add an output filter for this choreography.
		 * @param {string} name - The name of the output filter.
		 * @param {string} path - XPath of desired data in output variable.
		 * @param {string} outputVariableSource - The output variable containing the desired data.
		 */
		this.addOutputFilter = function(name, path, outputVariableSource){
			typeof outputFilters === 'undefined' && (outputFilters = {});
			outputFilters[name] = {path:path, variable:outputVariableSource};
		}

		/**
		 * Set an input for this choreography.
		 * @param {string} key - The name of the input.
		 * @param {string} value - The value of the input.
		 */
		this.setInput = function(key, value) {
			inputs[key] = value;
		};

		/**
		 * Set all inputs for this choreography.
		 * @param {Object.<string, string|number>} newInputs - The new key/value inputs.
		 */
		this.setInputs = function(newInputs) {
			inputs = typeof newInputs === 'object' ? newInputs : {};
		};

		/**
		 * Execute this choreography.
		 * @param {tembooSuccessCallback} successCallback - The callback that handles successful execution.
		 * @param {tembooErrorCallback} errorCallback - The callback that handles errors.
		 */
		this.execute = function(successCallback, errorCallback) {
			return proxy.request(name, inputs, outputFilters, successCallback, errorCallback);
		};
	};


	/**
	 * Communicates with a matching server-side Temboo Proxy to execute choreographies.
	 * @constructor
	 * @global
	 * @param {string} url - The url where you have installed your server-side Temboo Proxy.
	 * @param {string|boolean} [postVar=temboo_proxy] - An optional custom HTTP POST variable for the server-side request. Set false to post a raw JSON body instead of form-urlencoded.
	 */
	var TembooProxy = function(url, postVar) {

		var choreos = {};
		
		if(typeof postVar === 'undefined' || postVar === true) {
			postVar = 'temboo_proxy';
		}


		/**
		 * A choregraphy and associated inputs for execution with this TembooProxy.
		 * @constructs TembooProxiedChoreography
		 * @param {string} name - The name of this choreography in the server-side Temboo Proxy whitelist.
		 * @param {Object.<string, string|number>} inputs - The key/value inputs for this choreography.
		 */
		this.addChoreo = function(name, inputs) {
			choreos[name] = new TembooProxiedChoreography(this, name, inputs);
			return choreos[name];
		};

		/**
		 * Add an output filter for a choreography associated with this proxy.
		 * @param {string} name - The name of the proxied choreography.
		 * @param {string} filterName - The name of the output filter.
		 * @param {string} path - XPath of desired data in output variable.
		 * @param {string} outputVariableSource - The output variable containing the data.
		 */
		this.addOutputFilter = function(name, filterName, path, outputSourceVariable){
			getChoreo(name).addOutputFilter(filterName, path, outputSourceVariable);
		}

		/**
		 * Fetch a named TembooProxiedChoreography, creating it if necessary.
		 * This enables shortcuts like:
		 * @example results = new TembooProxy('/myProxy').execute('myChoreo', { Query: 'foo' });
		 * @private
		 */
		var getChoreo = function(name) {
			if(typeof choreos[name] === 'undefined') {
				this.addChoreo(name);
			}
			return choreos[name];
		};

		/**
		 * Set an input for a choreography associated with this proxy.
		 * @param {string} name - The name of the proxied choreography.
		 * @param {string} key - The name of the input.
		 * @param {string} value - The value of the input.
		 */
		this.setInput = function(name, key, value) {
			return getChoreo(name).setInput(key, value);
		};

		/**
		 * Set all inputs for a choreography associated with this proxy.
		 * @param {string} name - The name of the proxied choreography.
		 * @param {Object.<string, string|number>} newInputs - The new key/value inputs for the choreography.
		 */
		this.setInputs = function(name, newinputs) {
			return getChoreo(name).setInputs(newInputs);
		};

		/**
		 * Execute a choreography associated with this proxy.
		 * @param {string} name - The name of the proxied choreography.
		 * @param {tembooSuccessCallback} successCallback - The callback that handles successful execution.
		 * @param {tembooErrorCallback} errorCallback - The callback that handles errors.
		 */
		this.execute = function(name, successCallback, errorCallback) {
			return getChoreo(name).execute(successCallback, errorCallback);
		};

		/**
		 * Send an execution request for a choreography to the matching server-side proxy and dispatch results/errors.
		 * @param {string} name - The name of the proxied choreography.
		 * @param {Object.<string, string|number>} inputs - The key/value inputs for the choreography.
		 * @param {Object.<string, string>} outputFilters - The named output filters for filtering choreography results.
		 * @param {tembooSuccessCallback} successCallback - The callback that handles successful execution.
		 * @param {tembooErrorCallback} errorCallback - The callback that handles errors.
		 */
		this.request = function(name, inputs, outputFilters, successCallback, errorCallback) {
			var jsonData = JSON.stringify({name: name, inputs: inputs, outputFilters: outputFilters, version: VERSION});
			var contentType = postVar ? 'application/x-www-form-urlencoded' : 'application/json';
			var postData = postVar ? encodeURIComponent(postVar) + '=' + encodeURIComponent(jsonData) : jsonData;
			var xhr;

			if(XMLHttpRequest) {
				xhr = new XMLHttpRequest();
			} else if(ActiveXObject) {
				xhr = new ActiveXObject('MSXML2.XMLHTTP.3.0');
			} else {
				return errorCallback({
					type: 'Client',
					message: 'No HTTP client found.'
				});
			}

			xhr.open('POST', url, true);
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xhr.setRequestHeader('Content-type', contentType);
			xhr.setRequestHeader('Accept', 'application/json');
			xhr.onreadystatechange = function(){
				if(xhr.readyState === 4) {
					if(xhr.status >= 200 && xhr.status < 300) {
						data = JSON.parse(xhr.responseText);
						if(data.success) {
							return successCallback(data.outputs, outputFilters);
						}
						if(data.error) {
							delete data.error;
							return errorCallback(data);
						}
						return errorCallback({
							type: 'Unknown',
							message: 'An unknown error occured',
							serverResponse: xhr.responseText
						});
					} else if(xhr.status == 400){
						return errorCallback({
							type: 'BadReqeust',
							message: 'The server did not understand the request',
							status: xhr.status
						});
					} else if(xhr.status == 500){
						return errorCallback({
							type: 'Server',
							message: 'An unknown server error occurred',
							status: xhr.status
						});
					} else {
						return errorCallback({
							type: 'Unknown',
							message: 'An unknown error occurred',
							status: xhr.status
						});
					}
				}
			};
			xhr.send(postData);
		};

	};


	/**
	 * A callback that handles successful execution of a proxied choreography.
	 * @callback tembooSuccessCallback
	 * @param {Object<string,*>} outputs - The named output(s) of the execution.
	 */

	/**
	 * A callback that handles execution errors for a proxied choreography.
	 * @callback tembooErrorCallback
	 * @param {TembooError} error - The error object.
	 */

	/**
	 * An error object for failed executions.
	 * @typedef {Object} TembooError
	 * @property {string} type - The type of error. One of: DisallowedInput, NotFound, Execution, Authentication, Temboo, Server, Network, Client, Unknown
	 * @property {string} message - The error message.
	 * @property {?string} inputName - The failed input for DisallowedInput type errors.
	 * @property {?string|Object} serverResponse - The raw response body for Server type errors.
	 * @property {?string} status - The network status for Network type errors.
	 */


	/** Export TembooProxy for browser window or CommonJS modules */
	if(typeof module !== 'undefined') {
		module.exports = TembooProxy;
	} else if(typeof window !== 'undefined') {
		window.TembooProxy = TembooProxy;
	}
}());
