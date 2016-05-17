var xmlhttp;
if (window.XMLHttpRequest) {
    xmlhttp = new XMLHttpRequest();
}

/*
 * Remove an item. A "X" was clicked, now that item must be removed.
 * The listId is the ID of the <ul> object that contains the visible
 * list, the hiddenId is the ID of the hidden <input> object that
 * contains the elements. The linkId is the ID of the <a> object 
 * which had the link that was clicked.
 */
function removeItem(listId, hiddenId, linkId) {
    alert("Clicked on " + linkId + " for " + listId);
    var list = $(listId);
    alert("Got list " + list.html());
    var item = $(listId + " #li-" + linkId);
    alert("Got item " + item.html());
    item.remove();

    var currentHidden = $(hiddenId) . val();
    var selectUniqueId = linkId.substring(7);
    // alert("link id " + linkId + ", unique ID " + selectUniqueId);
    // alert("Current hidden was: " + currentHidden + ", remove " + selectUniqueId);
    currentHidden = currentHidden.replace("; " + selectUniqueId, "");
    currentHidden = currentHidden.replace(selectUniqueId + "; ", "");
    currentHidden = currentHidden.replace(selectUniqueId, "");
    // alert("Current hidden becomes " + currentHidden);
    $(hiddenId).val(currentHidden);
    
}

$(document).ready(function() {
    //$(".people-box").change(function() {
    //alert("people box changed");
    //});
    $(".remove-link").click(function() {
	alert("got click");
                                removeItem("#xx1-list", "#xx1-hdid", this.id);
                            });
    $(".people-class")
        // don't navigate away from the field on tab when selecting an item
        .bind("keydown", function(event) {
            if ((event.keyCode === $.ui.keyCode.TAB) &&
                    $( this ).data( "autocomplete" ).menu.active) {
                event.preventDefault();
            }
        })
        .autocomplete({
            minLength: 0,
            source: function(request, response) {
                var my_JSON_object = {};
                var http_request = new XMLHttpRequest();
                var term = request.term;
                var offset = term.lastIndexOf(";");
                if (offset >= 0) {
                    term = term.substr(offset + 1);
                }
                http_request.open("GET", "/cgi-bin/photos/phajax?limit=15&pattern=" + term, true);
                http_request.onreadystatechange = function () {
                    var done = 4, ok = 200;
                    if (http_request.readyState == done && http_request.status == ok) {
                        my_JSON_object = JSON.parse(http_request.responseText);
                        response(my_JSON_object);
                    }
                };
                http_request.send(null);
            },
            select: function(request, response) {
                var terms = this.value.split(";");
                terms.pop();
                // terms.push(response.item.value);
                terms.push("");
                this.value = terms.join("; ");

                var selectedName = response.item.label;
                var selectedUniqueId = response.item.id;
                var removeId = "remove-" + selectedUniqueId;
                
                var id = $(this).attr('id');
                var listId = "#" + id + "-list";
                var hiddenId = "#" + id + "-hdid";

                var currentHidden = $(hiddenId).val();
                if (currentHidden.indexOf(selectedUniqueId) < 0) {
                    // Only do all of this if the person isn't already
                    // selected
                    if (currentHidden != "") {
                        currentHidden += "; ";
                    }
                    currentHidden += selectedUniqueId;
                    // alert("hidden field " + hiddenId
                    //        + " currently " + currentHidden);
                    $(hiddenId).val(currentHidden);

                    //alert("listId = " + listId + ", hiddenId = " + hiddenId);
                    var currentList = $(listId).html();

                    var listItem = $(document.createElement("li"))
                        .attr({id: "li-" + removeId})
                        .append($(document.createTextNode(selectedName)));

                    var link = $(document.createElement("a"))
                        .attr({href: '#', id: removeId})
                        .append($(document.createTextNode("x")))
                        .appendTo(listItem)
                        .click(function() {
                                removeItem(listId, hiddenId, this.id);
                            });
                    $(listId).append(listItem);
/*
                    currentList += "<li>" + selectedName + "<a id='" + removeId + "' href='#" + removeId + "'>x</a></li> ";
                    
                    // alert("html for " + listId + " becomes" + currentList);
                    $(listId).html(currentList);
                    $("#"+removeId).click(function() {
                            alert("clicked on " + this.id());
                        });
*/
                }

                return false;
            }
        })
/*
        .data("autocomplete")._renderItem = function(ul, item) {
	    return $("<li></li>")
		   .data("item.autocomplete", item)
		   .append("" + item.label + "")
		   .appendTo(ul);
	}
*/
    });

/*
window.onload = function() {
    if (xmlhttp) {
        var msg = document.getElementById("display-area");
        msg.innerHTML = "Attaching handler";
        var box = document.getElementById("people-box");
        box.onchange = function() { changeBox() };
        
        //if (box.addEventListener) {
        //    box.addEventListener("keypress", changeBox, false);
        //} else {
        //    box.attachEvent("change", changeBox);
        //}
    }
}
*/

function changeBox() {
    var box = document.getElementById("people-box");
    alert(box.value);
}
    /*
        xmlhttp.onreadystatechange = function() {
            var box = document.getElementById("display-area");
            if ((xmlhttp.readyState == 4) && (xmlhttp.status == 200)) {
                box.innerHTML = xmlhttp.responseText;
            } else {
                box.innerHTML = "Got invalid response";
            }
        }
        xmlhttp.open("GET", "ajax.php", true);
        xmlhttp.send();
    */

