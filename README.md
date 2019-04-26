# summernote-autocomplete-plugin
A autocomplete plugin for summernote

![img](https://github.com/bzhu-91/summernote-autocomplete-plugin/blob/master/demo.gif?raw=true)

Usage example:
```
var editor = $(".summernote").summernote();
editor.summernote('autoComplete.setDataSrc', function (keyword, callback) {
	$.ajax({
		url: "getMySuggestions.php?keyword=" + encodeURIComponent(keyword);
		headers: {Accept: "application/json"},
		success: function (data) {
			callback(data);
		}
	})
});
editor.summernote('autoComplete.setTriggerSymbol', '#');
editor.summernote('autoComplete.on', 'insertSuggestion', function(suggestion) {
  alert("The uesr has get the suggestion:" + suggestion);
})
```
For suggestions:
1. array of strings
2. array of objects
Each object should have either "label" or "text" key. "label" is prefered. Value of "label" or "text" is used in the dropdown menu.
If the object also has a "content" key, then the value of "content" key is prefered as inserted text.
