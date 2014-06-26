(function(factory) {
	if (typeof define==='function' && define.amd) {
		define([], factory);
	}
	else {
		window.validictory = factory();
	}
}(function() {
	var exports,
		$ = window.jQuery || window.Zepto || window.puredom;
	
	function V(){}
	
	V.extend = function(base) {
		var i, j, ext;
		base = base || {};
		for (i=1; i<arguments.length; i++) {
			ext = arguments[i];
			if (ext) {
				for (j in ext) {
					if (ext.hasOwnProperty(j)) {
						base[j] = ext[j];
					}
				}
			}
		}
		return base;
	};
	
	V.concat = function() {
		var array = [], x, y;
		for (x=0; x<arguments.length; x++) {
			for (y=0; y<arguments[x].length; y++) {
				array.push(arguments[x][y]);
			}
		}
		return array;
	};
	
	V.prototype.extend = function() {
		V.extend.apply(this, V.concat([this], arguments));
		return this;
	};
	
	V.extend(V.prototype, {
		log : function(ns, message) {
			if (window.console && window.console.log) {
				window.console.log(ns, message);
			}
		}
	});
	
	exports = function(form) {
		var validictory = new V();
		form = $(form);
	
		validictory.extend({
		
			/** IE Major Version. false for non-IE browsers.
			 *	@type {Number|Boolean}
			 */
			ieVersion : (function() {
				var search = (/\bMSIE\s*([0-9]+)/gm).exec(navigator.userAgent);
				return search && search[1] && parseInt(search[1],10) || false;
			}()),
		
			/**
			 *	Generic Form Validation
			 */
			validation : {
				attributeName : 'data-validate',
				defaultErrorMessage : 'Invalid',
				messageFadeDuration : 100,
			
				idIndex : 0,
			
				init : function() {
					var self = this;
				
					// 90's throwback y'all
					this.fieldChangeHandler.validation = this;
					this.fieldFocusHandler.validation = this;
					this.fieldBlurHandler.validation = this;
					this.formSubmitHandler.validation = this;
				
					form.find('input['+this.attributeName+'], textarea['+this.attributeName+'], select['+this.attributeName+']').each(function() {
						var field = $(this);
						self.addFieldValidation(field, field.attr(self.attributeName));
					});
				
					form.each(function() {
						var form = $(this);
						if (form.find('input.hasValidation, textarea.hasValidation, select.hasValidation').length>0) {
							self.addFormValidation(form);
						}
					});
				
					self = null;
				},
			
				addFieldValidation : function(field, type) {
					type = (type || 'none').toLowerCase();
					field.addClass('hasValidation');
				
					// change events
					field.change(this.fieldChangeHandler);
					field.keyup(this.fieldChangeHandler);
					field.mouseup(this.fieldChangeHandler);
					field.focus(this.fieldChangeHandler);
				
					// focal events
					field.focus(this.fieldFocusHandler);
					field.blur(this.fieldBlurHandler);
				},
			
				addFormValidation : function(form) {
					form.addClass('hasValidation');
				
					// hook form submission
					form.submit(this.formSubmitHandler);
				},
			
			
				formSubmitHandler : function formSubmitHandler(e) {
					var self = formSubmitHandler.validation,
						form = $(this),
						inputs = form.find('input.hasValidation, textarea.hasValidation, select.hasValidation'),
						config = {
							mode : 'submit'
						},
						formInvalid = false;
				
					inputs.each(function() {
						var input = $(this),
							response = self.validateField(input, config);
						if (response.invalid===true) {
							formInvalid = true;
						}
					});
				
					if (formInvalid) {
						e.preventDefault();
						return false;
					}
				},
			
				fieldFocusHandler : function() {
					var self = $(this),
						id = self.attr('data-validatorid'),
						pos = self.offset(),
						messageDialog = id && $('#validatorMessage_'+id);
					if (messageDialog && messageDialog.length>0) {
						messageDialog.show();
						pos.left += self.width() - messageDialog.width();
						messageDialog.offset(pos);
					}
				},
			
				fieldBlurHandler : function() {
					var id = parseInt($(this).attr('data-validatorid'), 10);
					if (id || id===0) {
						$('#validatorMessage_'+id).hide();
					}
				},
			
				getFieldValidationConfig : function(field) {
					var config = {
							validators : []
						},
						cfg = field.attr(this.attributeName),
						cfgParts = cfg.split('|'),
						part, args, i, argSplitIndex;
					for (i=0; i<cfgParts.length; i++) {
						part = cfgParts[i];
						if (part && part.length>1) {
							args = [];
							argSplitIndex = part.indexOf(':');
							if (argSplitIndex>-1) {
								args = part.substring(argSplitIndex+1).split(',');
								part = part.substring(0, argSplitIndex);
							}
							config.validators.push({
								name : part,
								args : args
							});
						}
					}
					return config;
				},
			
				validateField : function(field, validationConfig) {
					var response, value, config, i, validator, validatorCfg, response, hasFalse=false, hasTrue=false, pos, messageDialog, message, fieldLabel, fieldErrorPlaceholder;
					validationConfig = validationConfig || {};
					field = $(field);
					value = field.val();
					config = this.getFieldValidationConfig(field);
					for (i=0; i<config.validators.length; i++) {
						validatorCfg = config.validators[i];
						validator = this.validationTypes[(validatorCfg.name + '').toLowerCase()];
						response = true;
						if (validator) {
							response = validator.validate(value, field, validatorCfg.args || [], this, {
								mode : validationConfig.mode || 'live'
							});
						}
						if (response===false) {
							hasFalse = true;
							if (validator.getErrorMessage) {
								message = validator.getErrorMessage(field);
							}
							if (!message) {
								message = validator.errorMessage || this.defaultErrorMessage;
							}
						
							fieldErrorPlaceholder = field.parent().find('.errorPlaceholder');
							if (fieldErrorPlaceholder.length===0) {
								fieldErrorPlaceholder = null;
							}
						
							// templating
							if (field.attr('data-validate-message')) {
								message = field.attr('data-validate-message');
							}
							else {
								fieldLabel = field.attr('data-validate-label') || 'Field';
								message = message.replace(/\{\$fieldname\}/gim, fieldLabel);
							}
						
							field.addClass('invalid');
							if (!field.attr('data-validatorid')) {
								this.idIndex += 1;
								field.attr('data-validatorid', this.idIndex+'');
							}
							messageDialog = $('#validatorMessage_'+field.attr('data-validatorid'));
							if (!document.getElementById('validatorMessage_'+field.attr('data-validatorid'))) {
								messageDialog = $('<div class="validatorMessage" id="validatorMessage_'+field.attr('data-validatorid')+'"><div class="inner">'+message+'</div></div>');
								messageDialog.appendTo(fieldErrorPlaceholder || document.body).find('.inner').html(message);
							}
							else {
								messageDialog.find('.inner').html(message);
							}
							pos = field.offset();
							messageDialog.show();
							if (fieldErrorPlaceholder) {
								messageDialog.addClass('inlineError');
							}
							else {
								messageDialog.removeClass('inlineError');
								pos.left += field.width() - messageDialog.width();
								pos.left = Math.ceil(pos.left);
								pos.top = Math.ceil(pos.top);
								if (messageDialog.attr('data-last-offset')!==(pos.top + ',' + pos.left)) {
									messageDialog.attr('data-last-offset', pos.top + ',' + pos.left);
									messageDialog.offset(pos);
								}
							}
							break;
						}
						if (response===true) {
							hasTrue = true;
						}
					}
					if (hasFalse!==true) {
						field.removeClass('invalid');
						$('#validatorMessage_'+field.attr('data-validatorid')).fadeOut(this.messageFadeDuration, this.messageDialogFadedHandler);
					}
					if (hasTrue===true) {
						field.addClass('valid');
					}
				
					return {
						valid		: !hasFalse,
						invalid		: hasFalse,
						hasTrue		: hasTrue,
						hasFalse	: hasFalse,
						message		: message,
						messageDialog : messageDialog
					};
				},
			
				messageDialogFadedHandler : function() {
					$(this).hide();
				},
			
				fieldChangeHandler : function fieldChangeHandler() {
					fieldChangeHandler.validation.validateField(this);
				},
			
				log : function(what) {
					if (window.console && window.console.log) {
						window.console.log('Validation -> ', what);
					}
				},
			
				addType : function(id, validator) {
					id = (id + '').toLowerCase();
					if (this.validationTypes.hasOwnProperty(id)) {
						this.log('Warning: overwriting existing validator "'+id+'".');
					}
					this.validationTypes[id] = validator;
				},
			
				/** @public The collection of validator objects. */
				validationTypes : {
					/** Field must be filled out */
					required : {
						errorMessage : "Required field",
						validate : function(value, field, args, validator, config) {
							if (config.mode==='submit') {
								return !!(value && (value+'').length>0);
							}
						}
					},
				
					minlength : {
						//errorMessage : "{$field_name} must be at least {$field_minlength} characters.",
						errorMessage : "Too short",
						validate : function(value, field, args, validator) {
							var minLength = args[0] || field.attr('minlength') || 0;
							return !!(value && value.length>minLength);
						}
					},
				
					maxlength : {
						//errorMessage : "{$field_name} must be at least {$field_minlength} characters.",
						errorMessage : "Too long",
						validate : function(value, field, args, validator) {
							var maxLength = args[0] || field.attr('maxlength') || 0;
							return !!(value && value.length<maxLength);
						}
					},
				
					/** Valid email addresses */
					email : {
						emailReg : /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/gim,
						errorMessage : "Invalid email",
						validate : function(value, field, args, validator) {
							return !!(value && value.match(this.emailReg));
						}
					},
				
					/** Required value */
					value : {
						errorMessage : "Incorrect value",
						validate : function(value, field, args, validator, config) {
							if (config.mode==='submit') {
								return !!(value && value.match(args[0] || field.attr('data-required-value')));
							}
						}
					},
				
					/** Required value */
					checked : {
						errorMessage : "Required",
						validate : function(value, field, args, validator, config) {
							var req = (args && args[0] && args[0]==='false') ? false : true;
							if (config.mode==='submit') {
								return field[0].checked===req;
							}
						}
					},
				
					/** Valid postal or zip codes */
					ziporpostalcode : {
						validReg : /^(([a-z][0-9]){3}|[0-9]{5})$/gim,
						errorMessage : "Invalid ZIP",
						validate : function(value, field, args, validator) {
							return !!(value && value.match(this.validReg));
						}
					},
				
					/** Compare against a second field for a match */
					fieldcompare : {
						errorMessage : "{$fieldname} didn't match",
						getErrorMessage : function(field) {
							var label = field.attr('data-validate-label') || 'Field';
							return this.errorMessage.replace(/\{\$fieldname\}/gim, label);
						},
						validate : function(value, field, args, validator) {
							var otherField = args[0] || field.attr('data-otherfield');
							if (otherField.match(/^[a-z]/gim)) {
								otherField = '#' + otherField;
							}
							otherField = otherField && $(otherField).first();
							if (!otherField) {
								validator.log('Error: Unable to find another field for comparison.');
							}
							return !!(otherField && otherField.val()===value && value);
						}
					},
				
					/** Check for a valid credit card. Requires a "type" field. */
					creditcard : {
						errorMessage : "Invalid card number",
						validate : function(value, field, args, validator, config) {
							var typeField = field.attr('data-creditcard-typefield') || args[0],
								type;
							if (typeField && typeField.match(/^[a-z]/gim)) {
								typeField = '#' + typeField;
							}
							typeField = typeField && $(typeField).first();
							if (!typeField) {
								validator.log('Error: Unable to find credit card "type" field validation.');
							}
							else {
								type = typeField.val();
								return this.checkCardNumber(value, type);
							}
						},
						checkCardNumber : function(cardNum, type) {
							var card = this.getCardConfig(type),
								checksum = 0,
								j = 1,
								validPrefix = false,
								validLength = false,
								i, calc, prefixes, lengths;
							cardNum = (cardNum + '').replace(this.sanitizeReg,'');		// remove whitespace and dashes
							// card type and value must exist
							if (!card || !cardNum) {
								return false;
							}
							// value is numeric and 13-19 chars
							if (!cardNum.match(this.cardNumberReg)) {
								return false;
							}
							cardNum = (cardNum + '').replace(this.numericOnlyReg,'');	// just numbers
							// ensure a valid checksum
							if (card.checkdigit!==false) {
								for (i=cardNum.length; i--; ) {
									calc = parseInt(cardNum.charAt(i),10) * j;
									if (calc>9) {
										checksum += 1;
										calc -= 10;
									}
									checksum += calc;
									j = j===1?2:1;
								}
								if (checksum%10!==0) {
									return false;
								}
							}
							// ensure a valid prefix, as defined in the card config
							prefixes = card.prefixes.split(',');
							for (i=prefixes.length; i--; ) {
								if (cardNum.substring(0,prefixes[i].length)===prefixes[i]) {
									validPrefix = true;
									break;
								}
							}
							if (!validPrefix) {
								return false;
							}
							// ensure the length is valid, as defined in the card config
							if ((card.lengths.indexOf(cardNum.length)<0) {
								return false;
							}
							// Everything checks out! It's a valid card number.
							return true;
						},
						getCardConfig : function(type) {
							var i, prop, card;
							type = (type+'').toLowerCase().replace(this.mushReg,'');
							if (this.cards.hasOwnProperty(type)) {
								return this.cards[type];
							}
							for (i in this.cards) {
								if (this.cards.hasOwnProperty(i)) {
									prop = (i+'').toLowerCase().replace(this.mushReg,'');
									card = (this.cards[i].cardName+'').toLowerCase().replace(this.mushReg,'');
									if (prop===type || card===type) {
										return this.cards[i];
									}
								}
							}
							return false;
						},
						mushReg : /[^0-9a-z]/gim,
						sanitizeReg : /[\s-]/gim,
						numericOnlyReg : /[^0-9]/gm,
						cardNumberReg : /^[0-9]{13,19}$/,
					
						cards : {
							visa			: { cardName:'Visa', lengths:'13,16', prefixes:'4' },		/* @optional: checkdigit:false */
							mastercard		: { cardName:'MasterCard', lengths:'16', prefixes:'51,52,53,54,55' },
							dinersclub		: { cardName:'DinersClub', lengths:'14,16', prefixes:'305,36,38,54,55' },
							carteblanche	: { cardName:'CarteBlanche', lengths:'14', prefixes:'300,301,302,303,304,305' },
							amex			: { cardName:'AmericanExpress', lengths:'15', prefixes:'34,37' },
							discover		: { cardName:'Discover', lengths:'16', prefixes:'6011,622,64,65' },
							jcb				: { cardName:'JCB', lengths:'16', prefixes:'35' },
							enroute			: { cardName:'enRoute', lengths:'15', prefixes:'2014,2149' },
							solo			: { cardName:'Solo', lengths:'16,18,19', prefixes:'6334, 6767' },
							_switch			: { cardName:'Switch', lengths:'16,18,19', prefixes:'4903,4905,4911,4936,564182,633110,6333,6759' },
							maestro			: { cardName:'Maestro', lengths:'12,13,14,15,16,18,19', prefixes:'5018,5020,5038,6304,6759,6761' },
							visaelectron	: { cardName:'VisaElectron', lengths:'16', prefixes:'417500,4917,4913,4508,4844' },
							lasercard		: { cardName:'LaserCard', lengths:'16,17,18,19', prefixes:'6304,6706,6771,6709' }
						}
					}
				
				}
			}
		});
	
		function setup() {
			var nonTypes = 'button submit reset checkbox radio image range file',			// note that file might be considered textual, except that it is nearly impossible to style.
				jsData = document.getElementById('js_configdata'),
				i, prop;
				if( $('input:not(.textual)') == null ) {
					return;
				}
			$('input:not(.textual)').each(function() {
				var self = $(this),
					type = (self.attr('type')+'').toLowerCase();
				if ((' '+nonTypes+' ').indexOf(' '+type+' ')<0) {
					self.addClass('textual');
				}
				else {
					self.addClass('nonTextual');
				}
			});
		
			if (!validictory.config) {
				validictory.config = {};
			}
			if (jsData) {
				for (i=jsData.attributes.length; i--; ) {
					prop = jsData.attributes[i].name;
					if (prop.substring(0,5)==='data-') {
						prop = prop.substring(5).toLowerCase();
						validictory.config[prop] = jsData.attributes[i].value;
					}
				}
			}
			
			validictory.validation.init();
		}
		
		setup();
		
		return validictory;
	};
	
	return exports;
}());
