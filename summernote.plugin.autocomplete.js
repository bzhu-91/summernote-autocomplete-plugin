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
			self.triggerSymbol = null;
			self.getSuggestions = {}
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
							var dataSrc = self.getSuggestions[self.triggerSymbol];
							dataSrc(self.$tmpContainer.text().substr(1), function(suggestions){
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
					if (e.key in self.getSuggestions && !self.autoCompleteMode) {
						self.triggerSymbol = e.key;
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
							case self.triggerSymbol:
								self.exitAutoCompleteMode();
								return;
						}
					}
				}
			};

			// create suggestion view
			self.initialize = function () {
				self.$dropdown = $("<div></div>")
					.css({
						background: "white", 
						position: "absolute",
						zIndex: 1000,
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
				self.$tmpContainer.html(self.triggerSymbol);
				context.invoke("insertNode", self.$tmpContainer[0]);
			}
			// exit mode
			self.exitAutoCompleteMode = function () {
				self.autoCompleteMode = false;
				self.$tmpContainer.html("").remove();
				self.$dropdown.hide();
			}
			// from https://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
			self.isDomElement = function (obj) {
				try {
					//Using W3 DOM2 (works for FF, Opera and Chrome)
					return obj instanceof HTMLElement;
				  }
				  catch(e){
					//Browsers not supporting W3 DOM2 don't have HTMLElement and
					//an exception is thrown and we end up here. Testing some
					//properties that all elements have (works on IE7)
					return (typeof obj==="object") &&
					  (obj.nodeType===1) && (typeof obj.style === "object") &&
					  (typeof obj.ownerDocument ==="object");
				  }
			}
			// insert the suggestion
			// invoke the insertSuggestion event
			self.insertSuggestion = function () {
				var suggestion = self.$dropdown.children()[self.selectedSuggestion].value;
				var doInsertion = true;
				if ("insertSuggestion" in self.handlers) {
					for (let i = 0; i < self.handlers.insertSuggestion.length; i++) {
						const func = self.handlers.insertSuggestion[i];
						doInsertion = doInsertion && func(suggestion, self.triggerSymbol) !== false;
					}
				} 
				if (doInsertion) {
					var content = self.try(suggestion, ["content", "label", "text"]) || suggestion;
					if (content instanceof jQuery) {
						content.each(function(idx, el){
							context.invoke("insertNode", el);
						})
					} else if (self.isDomElement(content)) {
						context.invoke("insertNode", content);
					} else {
						var node = document.createElement("span");
						node.innerHTML = content;
						context.invoke("insertNode", node);
					} 
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
			self.setDataSrc = function (func, trigger) {
				// keyword, callback
				if (trigger && trigger.length == 1) {
					self.getSuggestions[trigger] = func;
				} else throw {
					message: "trigger symbol is in wrong format"
				}
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
