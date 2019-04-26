# summernote-autocomplete-plugin
A autocomplete plugin for summernote

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
}
```

