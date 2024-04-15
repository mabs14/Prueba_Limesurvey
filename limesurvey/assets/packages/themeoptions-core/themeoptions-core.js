var ThemeOptions = function () {
    "use strict";
    //////////////////
    // Define necessary globals

    // general_inherit_active is not present at global level
    // see: https://github.com/LimeSurvey/LimeSurvey/blob/1cbfa11b081f54763b28364472926b155efea5dc/themes/survey/vanilla/options/options.twig#L71
    var inheritPossible = ($('#general_inherit_active').length > 0);

    //get option Object from Template configuration options
    var optionObject = {
        "general_inherit": 1
    }

    var optionObjectInheritedValues = JSON.parse($('#optionInheritedValues').val());
    var optionCssFiles = JSON.parse($('#optionCssFiles').val());
    //get the global form
    var globalForm = $('.action_update_options_string_form');


    /////////////////
    // Define methods run on startup

    // #TemplateConfiguration_options is the id of the Options field in advanced option
    // getter for generalInherit
    var generalInherit = function () {
        return $('#TemplateConfiguration_options').val() === 'inherit';
    };

    //parse the options as set in the advanced form
    var parseOptionObject = function () {
        // If no general inherit, then pass the value of the "Options" field in advanced option to the object optionObject
        if ($('#TemplateConfiguration_options').length > 0 && !generalInherit()) {
            try {
                optionObject = JSON.parse($('#TemplateConfiguration_options').val());
            } catch (e) {
                console.ls ? console.ls.error('No valid option field!') : console.log('No valid option field!');
            }
        }
    };

    // Show/Hide fields on generalInherit
    // To hide a simple option on generalInherit: just add the class "action_hide_on_inherit" to the rows continaing it
    var startupGeneralInherit = function () {

        if (!inheritPossible) return false;

        if (generalInherit()) {
            $('#general_inherit_on').prop('checked', true).trigger('change').closest('label').addClass('active');
            // $('.action_hide_on_inherit').addClass('d-none');
            $('.tab_action_hide_on_inherit').addClass('ls-tab-disabled');

        } else {
            $('#general_inherit_off').prop('checked', true).trigger('change').closest('label').addClass('active');
            $('.action_hide_on_inherit_wrapper').addClass('d-none');
            $('.tab_action_hide_on_inherit').removeClass('ls-tab-disabled');
        }
    };

    // So this function find the selectors in the forum, and pass their values to the advanced options
    var updateFieldSettings = function () {

        if ($('#general_inherit_on').prop('checked')) {
            $('#TemplateConfiguration_options').val('inherit');
            return;
        }

        globalForm.find('.selector_option_value_field').each(function (i, item) {
            //disabled items should be inherit or false
            if ($(item).prop('disabled')) {
                $(item).val((inheritPossible ? 'inherit' : false));
            }

            optionObject[$(item).attr('name')] = $(item).val();
        });

        globalForm.find('.selector_image_selector').each(function (i, item) {

            // disable the preview image button if the image
            // selected could not be mapped to one of the images
            // that actually exists within the theme
            const src = $(item).find('option:selected').data('lightbox-src');
            const missing = src === '';
            const itemId = $(item).attr('id');
            const button = $(`button[data-bs-target="#${itemId}"]`);
            button.prop('disabled', missing);

            // add some feedback to the user, mark field invalid
            $(item).toggleClass('is-invalid', missing);
        });

        globalForm.find('.selector_option_radio_field ').each(function (i, item) {
            //disabled items should be inherit or false
            if ($(item).prop('disabled')) {
                $(item).val((inheritPossible ? 'inherit' : false));
            }

            if ($(item).attr('type') == 'radio') {
                if ($(item).prop('checked')) {
                    optionObject[$(item).attr('name')] = $(item).val();
                }
            }

        });

        globalForm.find('.selector_text_option_value_field').each(function (i, item) {
            //disabled items should be inherit or false
            if ($(item).prop('disabled')) {
                $(item).val((inheritPossible ? 'inherit' : false));
            }

            optionObject[$(item).attr('name')] = $(item).val();
        });

        var newOptionObject = $.extend(true, {}, optionObject);
        delete newOptionObject.general_inherit;

        $('#TemplateConfiguration_options').val(JSON.stringify(newOptionObject));
    };

    ///////////////
    // Utility Methods
    // -- small utilities i.g. for images or similar, or very specialized functions

    var applyColorPickerValue = function (item) {
        if ($(item).hasClass('selector__color-picker')) {
            console.ls.log($(item).data('inheritvalue'), $(item).val(), item);
            if ($(item).val() == 'inherit') {
                $(item).closest('.input-group').find('.selector__colorpicker-inherit-value').val($(item).data('inheritvalue')).trigger('change');
            } else {
                $(item).closest('.input-group').find('.selector__colorpicker-inherit-value').val($(item).val()).trigger('change');
            }
        }
    };

    //Special code for numerical
    var parseNumeric = function (item) {
        if ($(item).hasClass('selector-numerical-input')) {
            if (!(/^((\d+)|(inherit))$/.test($(item).val()))) {
                $(item).val((inheritPossible ? 'inherit' : 1000));
            }
        }
    }

    // display inherited options as tooltips
    var showInheritedValue = function () {
        $.each($("#simple_edit_add_css > option"), function (i, option) {
            $.each(optionCssFiles.add, function (i, item) {
                if (option.value == item && $("#simple_edit_add_css option:first").val() == 'inherit'){
                    $("#simple_edit_add_css option:first").text($("#simple_edit_add_css option:first").text()+' '+option.text+']');
                }
            });
        });

        globalForm.find('.selector-numerical-input').each(function (i, item) {
            var element = $(item);
            //element.attr('title', element.attr('title')+optionObjectInheritedValues[$(item).attr('name')]);
            element.tooltip();
        });

    };

    //Parses the option value for an item
    var parseOptionValue = function (item, fallbackValue) {
        if (fallbackValue == undefined) fallbackValue = false;
        // If general inherit, then the value of the dropdown is inherit, else it's the value defined in advanced options
        var itemValue = generalInherit() ? 'inherit' : optionObject[$(item).attr('name')];

        // If anything goes wrong (manual edit or anything else), we make sure it will have a correct value
        if (itemValue == null || itemValue == undefined) {
            itemValue = inheritPossible ? 'inherit' : fallbackValue;
            optionObject[$(item).attr('name')] = itemValue;
        }
        return itemValue;
    }

    //Set value and propagate to bootstrapSwitch
    var setAndPropageteToSwitch = function (item) {
        $(item).prop('checked', true).trigger('change');
        //$(item).closest('label').addClass('active');
    }


    ///////////////
    // Parser methods
    // -- These methods will either parse through existing fields, or set existing fields to their correct values

    // Update values in the form to the template options
    // selector_option_value_field are the select dropdown (like variations and fonts)
    // TODO: This seems to be designed for select fields only, but it is also used for other input types. Should be reviewed.
    var prepareSelectField = function () {
        globalForm.find('.selector_option_value_field').each(function (i, item) {
            var itemValue = parseOptionValue(item);
            $(item).val(itemValue);
            applyColorPickerValue(item);
        });
    };

    // Generate the state of switches (On/Off/Inherit)
    var parseParentSwitchFields = function () {
        globalForm.find('.selector_option_radio_field').each(function (i, item) {

            var itemValue = parseOptionValue(item, 'off');

            //if it is a radio selector, check it and propagate the change to bootstrapSwitch
            if ($(item).val() == itemValue) {
                setAndPropageteToSwitch(item);
            }
        });
    };

    var prepareFontField = function () {
        var currentPackageObject = 'inherit';
        if ($('body').hasClass('fruity_twentythree')) {
            optionObject.font = optionObject.font || (inheritPossible ? 'inherit' : 'ibm-sans');
        } else {
            optionObject.font = optionObject.font || (inheritPossible ? 'inherit' : 'roboto');
        }

        if (optionObject.font !== 'inherit') {
            $('#simple_edit_options_font').val(optionObject.font);
        }
        updateFieldSettings();
    };

    var prepareFruityThemeField = function () {
        var currentThemeObject = 'inherit';
        if ($('#TemplateConfiguration_files_css').val() !== 'inherit' && $('body').hasClass('fruity')) {
            currentThemeObject = {
                "add": ['css/animate.css', 'css/ajaxify.css', 'css/variations/sea_green.css', 'css/theme.css', 'custom.css']
            };

            try {
                currentThemeObject = JSON.parse($('#TemplateConfiguration_files_css').val());
            } catch (e) {
                console.error('No valid monochrom theme field!');
            }

            if (currentThemeObject.add) {
                $('#simple_edit_add_css').val(currentThemeObject.add.filter(function (item, i) {
                    return /^css\/variations\/.*$/.test(item);
                }));
            }
        }

    };

    // Update values of 'text' options in the form
    var prepareTextField = function () {
        globalForm.find('.selector_text_option_value_field').each(function (i, item) {
            var itemValue = parseOptionValue(item, "");
            $(item).val(itemValue);
        });
    };

    // updates the disabled status of a child field
    // based on the parent element
    // NOTE:
    // for font and variations dropdowns, the childfield
    // class is added and the data-parent attr exists,
    // but no parent element exists in the markup
    // so if we actually have a parent element, enable/disable
    // based on that, otherwise we enable by default
    const updateChild = function(parentEl, childEl) {

        let enabled = true;

        if(parentEl.length) {
            const parentOn = $(parentEl).val() === 'on';
            const parentChecked = $(parentEl).prop('checked') === true;
            enabled = parentOn && parentChecked;
        }

        $(childEl).prop('disabled', !enabled);
    }

    // grab the parent for a given child field
    const getParent = function(childEl) {
        const parentName = $(childEl).data('parent');
        const parentEl = $(`input[name=${parentName}]`);
        return parentEl;
    }

    // go through each child field, grab parent, and update disabled status
    const updateAllChildren = function() {
        $('.selector_radio_childfield').each(function (i, childEl) {
            const parentEl = getParent(childEl);
            updateChild(parentEl, childEl);
        });
    }

    ///////////////
    // HotSwap methods
    // -- These methods connect an input directly to the value in the optionsObject

    // Disable dependent inputs when their parents are set to off, or inherit
    const hotSwapParentRadioButtons = function () {

        // for each child field, add a listener for the
        // parent's change and update the child's disabled
        // status accordingly
        // i = element index in list of matches, unused
        $('.selector_radio_childfield').each(function (i, childEl) {
            const parentEl = getParent(childEl);

            parentEl.on('change', function () {
                updateChild(parentEl, childEl);
            });
        });
    };

    // hotswapping the fields
    var hotSwapFields = function () {

        globalForm.find('.selector_option_value_field, .selector_text_option_value_field').on('change', function (evt) {
            updateFieldSettings();
            parseNumeric(this);
        });

        globalForm.find('.selector_option_radio_field').on('change', function (evt) {
            updateFieldSettings();
            parseNumeric(this);
        });

    };

    var hotswapGeneralInherit = function () {
        //hotswapping the general inherit
        $('#general_inherit_on').on('change', function (evt) {
            $('#TemplateConfiguration_options').val('inherit');
            $('.action_hide_on_inherit_wrapper').removeClass('d-none');
            $('.tab_action_hide_on_inherit').addClass('ls-tab-disabled');


        });
        $('#general_inherit_off').on('change', function (evt) {
            $('.action_hide_on_inherit_wrapper').addClass('d-none');
            $('.tab_action_hide_on_inherit').removeClass('ls-tab-disabled');

            updateFieldSettings();
        });
    };

    var hotswapFontField = function () {
        $('#simple_edit_options_font').on('change', function (evt) {
            var currentPackageObject = $('#TemplateConfiguration_packages_to_load').val() !== 'inherit' ?
                JSON.parse($('#TemplateConfiguration_packages_to_load').val()) :
                $(this).data('inheritvalue');

            if (currentPackageObject === 'inherit') currentPackageObject = {add:[]};

            if ($('#simple_edit_options_font').val() === 'inherit') {

                $('#TemplateConfiguration_packages_to_load').val('inherit');

            } else {

                var selectedFontPackage = $(this).find('option:selected');
                var packageName = selectedFontPackage.data('font-package');
                var formatedPackageName = "font-" + packageName;

                var filteredAdd = currentPackageObject.add.filter(function (value, index) {
                    return !(/^font-.*$/.test(String(value)))
                })
                filteredAdd.push(formatedPackageName);
                currentPackageObject.add = filteredAdd
                $('#TemplateConfiguration_packages_to_load').val(JSON.stringify(currentPackageObject));
            }
        })
    }

    //hotswapping the colorpickers and adding the reset functionality
    var hotswapColorPicker = function () {

        globalForm.find('.selector__colorpicker-inherit-value')
            .on('change', function (e) {
                $(this).closest('.input-group').find('.selector_option_value_field').val($(this).val()).trigger('change');
            });

        globalForm.find('.selector__reset-colorfield-to-inherit').on('click', function (e) {
            e.preventDefault();
            var colorField = $(this).closest('.input-group').find('.selector__color-picker');
            console.ls.log(colorField, colorField.data('inheritvalue'));
            $(this).closest('.input-group').find('.selector__colorpicker-inherit-value').val(colorField.data('inheritvalue')).trigger('change');
            colorField.attr('type', 'text').val('inherit');
            optionObject[colorField.attr('name')] = 'inherit';
            updateFieldSettings();
        });
    };

    var hotswapFruityTheme = function () {
        $('#simple_edit_add_css').on('change', function (evt) {
            if ($('#simple_edit_add_css').val() === 'inherit') {
                $('#TemplateConfiguration_files_css').val('inherit');
            } else {
                var cssThemeToAdd = $('#simple_edit_add_css').val();
                var currentThemeObject = $('#TemplateConfiguration_files_css').val() != 'inherit' ?
                    JSON.parse($('#TemplateConfiguration_files_css').val()) :
                    $(this).data('inheritvalue');

                currentThemeObject.add = currentThemeObject.add.filter(function (item, i) {
                    return !(/^css\/variations\/.*$/.test(item));
                });
                currentThemeObject.add.push(cssThemeToAdd);

                $('#TemplateConfiguration_files_css').val(JSON.stringify(currentThemeObject));
            }
        });
    }

    var removeVariationsFromField = function (fieldSelector) {
        if ($(fieldSelector).val() === 'inherit') return;
        try {
            var currentValue = JSON.parse($(fieldSelector).val());
        } catch (error) {
            var currentValue = {};
        }
        var empty = true;
        ['add','replace','remove'].forEach(function(action){
            if (currentValue.hasOwnProperty(action)) {
                currentValue[action] = currentValue[action].filter(function (item) {
                    var itemToTest = action=='replace' ? item[1] : item;
                    return !(/^css\/variations\/.*$/.test(itemToTest));
                });
                if (currentValue[action].length) empty = false;;
            }
        });
        if (!empty) {
            $(fieldSelector).val(JSON.stringify(currentValue));
        } else {
            $(fieldSelector).val(inheritPossible ? "inherit" : JSON.stringify({}));
        }
    }

    var addVariationToField = function (file, fieldSelector, action) {
        var defaultValue = {};
        defaultValue[action] = [];

        try {
            var currentValue = JSON.parse($(fieldSelector).val());
        } catch (error) {
        }

        if (!currentValue || currentValue==='inherit') var currentValue = defaultValue;
        if (!currentValue.hasOwnProperty(action)) currentValue[action] = [];

        if (action == 'replace') {
            currentValue[action].push(["css/bootstrap.css", file]);
        } else {
            currentValue[action].unshift(file);
        }
        $(fieldSelector).val(JSON.stringify(currentValue));
    }

    var hotswapTheme = function () {
        $('#simple_edit_options_cssframework').on('change', function (evt) {
            var newThemeDataValue = $('option:selected', this).attr('data-value') || false;
            var selectedTheme = newThemeDataValue || $('#simple_edit_options_cssframework').val();
            var selectedThemeMode = $('#simple_edit_options_cssframework').find("option[value='"+selectedTheme+"']").attr('data-mode') || 'add';

            var filesField = selectedThemeMode == 'add' ? '#TemplateConfiguration_files_css' : '#TemplateConfiguration_cssframework_css';
            removeVariationsFromField('#TemplateConfiguration_files_css');
            removeVariationsFromField('#TemplateConfiguration_cssframework_css');
            if (selectedTheme != 'inherit') {
                addVariationToField(selectedTheme, filesField, selectedThemeMode);
            }
        });
    }

    ///////////////
    // Event methods
    // -- These methods are triggered on events. Please see `bind´ method for more information
    var onSaveButtonClickAction = function (evt) {
        evt.preventDefault();

        if ($('#general_inherit_on').prop('checked')) {
            $('#TemplateConfiguration_options').val('inherit');
            $('#template-options-form').trigger('submit'); // submit the form
        } else {
            updateFieldSettings();
            //Create a copy of the inherent optionObject
            var newOptionObject = $.extend(true, {}, optionObject);
            newOptionObject.generalInherit = null;

            //now write the newly created object to the correspondent field as a json string
            $('#TemplateConfiguration_options').val(JSON.stringify(newOptionObject));
            //and submit the form
            $('#template-options-form').trigger('submit');
        }
    };


    ///////////////
    // Instance methods
    var bind = function () {
        //if the save button is clicked write everything into the template option field and send the form
        $('#theme-options--submit').on('click', onSaveButtonClickAction);

        //Bind the hotwaps
        hotSwapParentRadioButtons();
        hotSwapFields();
        hotswapGeneralInherit();
        hotswapColorPicker();
        hotswapFontField();
        //hotswapFruityTheme();
        hotswapTheme();
    };

    var run = function () {
        parseOptionObject();

        startupGeneralInherit();

        prepareSelectField();
        prepareTextField();
        parseParentSwitchFields();
        prepareFontField();
        prepareFruityThemeField();
        showInheritedValue();

        bind();

        // set initial disabled status of child fields
        updateAllChildren();
    };

    return run;

};

var prepare = function () {

    var deferred = $.Deferred();

    var themeOptionStarter = new ThemeOptions();
    themeOptionStarter();

    setTimeout(function () {
        deferred.resolve()
    }, 650);
    return deferred.promise();
};


$(function () {
    $('.simple-template-edit-loading').css('display', 'block');
    prepare().then(function (runsesolve) {
        $('.simple-template-edit-loading').css('display', 'none');
    });

    $('.selector__open_lightbox').on('click', function (e) {
        e.preventDefault();
        var imgSrc = $($(this).data('bs-target')).find('option:selected').data('lightbox-src');
        var imgTitle = $($(this).data('bs-target')).val();
        imgTitle = imgTitle.split('/').pop();
        $('#lightbox-modal').find('.selector__title').text(imgTitle);
        $('#lightbox-modal').find('.selector__image').attr({
            'src': imgSrc,
            'alt': imgTitle
        });
        $('#lightbox-modal').modal('show');
    });

    $('.simple_edit_options_checkicon').on('change', function () {
        $(this).siblings('.selector__checkicon-preview').find('i').html('&#x' + $(this).val() + ';');
        if ($(this).val() == 'inherit') {
            $(this).siblings('.selector__checkicon-preview').find('i').html('&#x' + $(this).siblings('.selector__checkicon-preview').find('i').data('inheritvalue') + ';');
        }
    })

    var uploadImageBind = new bindUpload({
        form: '#upload_frontend',
        input: '#upload_image_frontend',
        progress: '#upload_progress_frontend',
        onBeforeSend: function () {
            $('.simple-template-edit-loading').css('display', 'block');
        },
        onSuccess: function () {
            setTimeout(function () {
                $(document).trigger('pjax:load', {
                    url: window.location.href
                });
            }, 2500);
        }
    });
});
