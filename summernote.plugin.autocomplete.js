/**
 * 
 * copyright [2019] [Bingyao Zhu].
 * email: bzhu@outlook.de
 * license: MIT
 * 
 */
(function (factory) {
	/* global define */
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof module === 'object' && module.exports) {
		// Node/CommonJS
		module.exports = factory(require('jquery'));
	} else {
		// Browser globals
		factory(window.jQuery);
	}
}(function ($) {
	$.extend($.summernote.plugins, {
		/**
		 * @param {Object} context - context object has status of editor.
		 */
		'autoComplete': function (context) {
			var self = this;
			
			// variables
			self.autoCompleteMode = false;
			self.selectedSuggestion = 0;
			self.handlers = {}
			self.triggerSymbol = "#"; // the special symbol to enter the suggestion mode
			self.getSuggestions = function () {return null;} // place holder function
			self.events = {
				'summernote.keyup': function (we, e) {
					if (self.autoCompleteMode) {
						var keyword = self.$tmpContainer.text().trim();
						switch (e.key) {
							case "Backspace":
								if (keyword == self.triggerSymbol) {
									self.exitAutoCompleteMode()
									return;
								}
							case "ArrowDown": // arrow down
								e.preventDefault();	
								if (self.selectedSuggestion == self.$dropdown.children().length - 1) { // at the last
									self.highlightSuggestion(0);
								} else {
									self.highlightSuggestion(self.selectedSuggestion + 1);
								}
								return;
							case "ArrowUp": // arrow up
								e.preventDefault();	
								var len = self.$dropdown.children().length;
								if (self.selectedSuggestion == 0) {
									self.highlightSuggestion(len-1);
								} else {
									self.highlightSuggestion(self.selectedSuggestion - 1);
								}
								return;
						}
						if (keyword.length > 1) {
							self.getSuggestions(self.$tmpContainer.text().substr(1), function(suggestions){
								self.visualizeSuggestions(suggestions);
								self.highlightSuggestion(0);
								try {
									var pos = self.getSelectionCoords();
									self.$dropdown.css({left: pos.x + 10, top: pos.y + 16})
								} catch (e) {
									console.log(e)
								}
							});
						}
					}
				},
				'summernote.keydown': function (we, e) {
					if (e.key == self.triggerSymbol && !self.autoCompleteMode) {
						// # key entered
						self.enterAutoCompleteMode(e);
					} else if (self.autoCompleteMode) {
						switch (e.key) {
							case "Escape":
								self.exitAutoCompleteMode();
								return;
							case "Enter":
								e.preventDefault();	
								self.insertSuggestion();
								self.exitAutoCompleteMode();
								return;
							case self.triggerSymbol: // input # when user hit # twice
								self.exitAutoCompleteMode();
								return;
						}
					}
				}
			};

			// create suggestion view
      // create tmp container for keywords
			self.initialize = function () {
				self.$dropdown = $("<div></div>")
					.css({
						background: "white", 
						position: "absolute", 
						display: "block", 
						border: "1px solid #999", 
						borderRadius: "5px", 
						padding: 0}).hide();
				self.$dropdown.appendTo('body');
				self.$tmpContainer = $("<span></span>").css({padding: "5px", background: "lightblue", borderRadius: "4px"}).html(" ");
			};

			// destroy suggestion view
			self.destroy = function () {
				self.$dropdown.remove();
				self.$tmpContainer.remove();
				self.$tmpContainer = null;
				self.$dropdown = null;
			};
			// enter mode
			self.enterAutoCompleteMode = function (e) {
				e.preventDefault();
				self.autoCompleteMode = true;
				self.$tmpContainer.html("#");
				context.invoke("insertNode", self.$tmpContainer[0]);
			}
			// exit mode
			self.exitAutoCompleteMode = function () {
				self.autoCompleteMode = false;
				self.$tmpContainer.html("").remove();
				self.$dropdown.hide();
			}
			// insert the suggestion
			// invoke the insertSuggestion event
			self.insertSuggestion = function () {
				var suggestion = self.$dropdown.children()[self.selectedSuggestion].value;
				var doInsertion = true;
				if ("insertSuggestion" in self.handlers) {
					for (let i = 0; i < self.handlers.insertSuggestion.length; i++) {
						const func = self.handlers.insertSuggestion[i];
						doInsertion = doInsertion && func(suggestion) !== false; // if the event hanlder returns false, do not insert
					}
					self.handlers.insertSuggestion.forEach(function(func){
						func(suggestion);
					});
				} 
				if (doInsertion) {
					var node = document.createElement("span");
					node.innerHTML = self.try(suggestion, ["content", "label", "text"]) || suggestion;
					context.invoke("insertNode", node);
				}
			}
			// highlightsuggestion
			self.highlightSuggestion = function (which) {
				if (which != self.selectedSuggestion) {
					$(self.$dropdown.children()[self.selectedSuggestion]).css({background: "transparent"});
					$(self.$dropdown.children()[which]).css({background: "#ededed"});
					self.selectedSuggestion = which;
				}
			}
			// create the list of dropdown and position it at the caret
			self.visualizeSuggestions = function (list) {
				self.$dropdown.show();
				self.$dropdown.html("");
				if (list && list.length > 0) {
					list.forEach(function(suggestion, idx){
						var li = $("<p></p>")
							.html(self.try(suggestion, ["label", "text"]) || suggestion)
							.css({
								padding: "5px 10px", cursor: "pointer", margin: 0
							})
							.prop("value", suggestion);
						if (idx == 0) {
							li.css({
								background: "#eee"
							})
						}
						self.$dropdown.append(li);
					});
				} else {
					self.$dropdown.html("<p style='padding: 5px'>No suggestions</p>");
				}
			}
			// set the data source
			// func has two params: key, callback
			// should call callback with the list
			self.setDataSrc = function (func) {
				// keyword, callback
				self.getSuggestions = func;
			}
			// set the trigger symbol, by default #
			self.setTriggerSymbol = function (s) {
				self.triggerSymbol = s;
			}
			self.getSelectionCoords = function(win) {
				win = win || window;
				var doc = win.document;
				var sel = doc.selection, range, rects, rect;
				var x = 0, y = 0;
				if (sel) {
					if (sel.type != "Control") {
						range = sel.createRange();
						range.collapse(true);
						x = range.boundingLeft;
						y = range.boundingTop;
					}
				} else if (win.getSelection) {
					sel = win.getSelection();
					if (sel.rangeCount) {
						range = sel.getRangeAt(0).cloneRange();
						if (range.getClientRects) {
							range.collapse(true);
							rects = range.getClientRects();
							if (rects.length > 0) {
								rect = rects[0];
							}
							x = rect.left;
							y = rect.top;
						}
						// Fall back to inserting a temporary element
						if (x == 0 && y == 0) {
							var span = doc.createElement("span");
							if (span.getClientRects) {
								// Ensure span has dimensions and position by
								// adding a zero-width space character
								span.appendChild( doc.createTextNode("\u200b") );
								range.insertNode(span);
								rect = span.getClientRects()[0];
								x = rect.left;
								y = rect.top;
								var spanParent = span.parentNode;
								spanParent.removeChild(span);
			
								// Glue any broken text nodes back together
								spanParent.normalize();
							}
						}
					}
				}
				return { x: x, y: y };
			}
			self.on = function (evtype, func) {
				if (!(evtype in self.handlers)) {
					self.handlers[evtype] = [];
				}
				self.handlers[evtype].push(func)
			}
			self.off = function (evtype, func) {
				if (evtype in self.handlers) {
					if (func) {
						var idx = self.handlers[evtype].indexOf(func);
						if (idx != -1) self.handlers[evtype].splice(idx,1);
					} else {
						delete self.handlers[evtype];
					}
				}
			}
			self.try = function (obj, keys) {
				if (obj && typeof obj === 'object' && obj.constructor === Object) {
					for (let i = 0; i < keys.length; i++) {
						const key = keys[i];
						if (key in obj) {
							return obj[key];
						}
					}
				}
				return null;
			}
		}
	});
}));
