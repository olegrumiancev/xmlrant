
var xmlRant = xmlRant || {};

xmlRant.init = function() {
    if (Prism != null) {
        Prism.plugins.NormalizeWhitespace.setDefaults({
            'remove-trailing': false,
            'remove-indent': false,
            'left-trim': false,
            'right-trim': false
        });
    }

    xmlRant.productUserDiv = null;
    xmlRant.productOverlay = null;
    xmlRant.productOverlayImage = null;
    xmlRant.loadedRantIds = [];
    
    xmlRant.defaults = {
        pageSize: 10,
        pageIndex: 0,
        progressSelector: "#progress",
        sort: "recent",
        type: "rant",
    };

    xmlRant.internal.initParameters();
    xmlRant.internal.registerStickyElements();
    xmlRant.internal.prepareImageOverlay();
    xmlRant.getData(xmlRant.progressSelector);

    $(window).scroll(function () {
        //if ($(window).scrollTop() == $(document).height() - $(window).height()) {
        if ($(window).scrollTop() + $(window).height() > $(document).height() - 200) {
            xmlRant.getData(xmlRant.progressSelector);
        }
    });
};

xmlRant.getData = function(progressIndicatorSelector) {
    if ($(progressIndicatorSelector).is(":visible")) {
        return;
    }

    $.ajax({
        type: 'GET',
        url: '/home/GetData',
        data: { 
            "type": xmlRant.type,
            "sort": xmlRant.sort, 
            "pageIndex": xmlRant.pageIndex, 
            "pageSize": xmlRant.pageSize
        },
        dataType: 'json',
        success: function (data) {
            if (data != null) {
                if (data.success) {
                    for (var i = 0; i < data.rants.length; i++) {
                        var uc = data.rants[i];

                        if ($.inArray(uc.id, xmlRant.loadedRantIds) > -1) {
                            continue;
                        }
                        xmlRant.loadedRantIds.push(uc.id);

                        var $insertBeforeThis = $("pre > code > span:last-child").prev();
                        $insertBeforeThis.before(xmlRant.content.createSingleContent(uc));
                        if (Prism != null) {
                            Prism.highlightElement($insertBeforeThis.prev()[0]);
                        }

                        // in firefox some empty spans still rendered with height, I want it to be 0
                        $(document).find('span').each(function() {
                            var $curr = $(this);
                            if ($curr.text().trim() == '') {
                                $curr.css('display', 'none');
                            }
                        });
                    }
                    xmlRant.pageIndex++;
                }

                var $contentsDiv = $('pre');
                if ($contentsDiv.height() < $(window).height()) {
                    $(progressIndicatorSelector).hide();
                    xmlRant.getData(progressIndicatorSelector);
                }
            }
        },
        beforeSend : function() {
            $(progressIndicatorSelector).show();
        },
        complete : function() {
            $(progressIndicatorSelector).hide();
        },
        error: function(err) {
            $(progressIndicatorSelector).hide();
            console.log(err);
        }
    });
}

xmlRant.internal = {
    initParameters: function() {
        if (xmlRant["pageSize"] == null) { xmlRant["pageSize"] = xmlRant.defaults["pageSize"]; }
        if (xmlRant["pageIndex"] == null) { xmlRant["pageIndex"] = xmlRant.defaults["pageIndex"]; }
        if (xmlRant["progressSelector"] == null) { xmlRant["progressSelector"] = xmlRant.defaults["progressSelector"]; }
        if (xmlRant["sort"] == null) { xmlRant["sort"] = xmlRant.defaults["sort"]; }
        if (xmlRant["type"] == null) { xmlRant["type"] = xmlRant.defaults["type"]; }
    },
    registerStickyElements: function() {
        setTimeout(function() {
            var $window = $(window),
            $stickyRootEl = $('#rootOpeningTag'),
            $stickyTypeElement = $('#typeOpeningTag'),
            elRootTop = $stickyRootEl.offset().top,
            elTypeTop = $stickyTypeElement.offset().top;

            $window.scroll(function() {
                $stickyRootEl.toggleClass('sticky', $window.scrollTop() > elRootTop);
                $stickyTypeElement.toggleClass('sticky', $window.scrollTop() + 20 > elTypeTop);
            });

            if (xmlRant.type == "rant") {
                var $stickySortEl = $('#sortOpeningTag'),
                elSortTop = $stickySortEl.offset().top;

                $window.scroll(function() {
                    $stickySortEl.toggleClass('sticky', $window.scrollTop() + 40 > elSortTop);
                });
            }
        }, 1000);
    },
    toggleVisibility: function(toggleElement, contentIdPart) {
        var $img = $(toggleElement);
        if ($img.attr('src').indexOf('minus') != -1) {
            $img.attr('src', '/images/plus.gif');
        } else {
            $img.attr('src', '/images/minus.gif');
        }
        $('#content_' + contentIdPart).toggle();
    },
    escapeHtml: function(str) {
        var div = document.createElement('div');
        var text = document.createTextNode(str);
        div.appendChild(text);
        return div.innerHTML;
    },
    prepareImageOverlay: function() {
        $('body').append('<div class="product-image-overlay"><span class="product-image-overlay-close">x</span><img src="" /><div></div id="userDetails"></div>');
        xmlRant.productOverlay = $('.product-image-overlay');
        xmlRant.productUserDiv = $('.product-image-overlay #userDetails');
        xmlRant.productOverlayImage = $('.product-image-overlay img');
    }
};

xmlRant.content = {
    createSingleContent: function(userContent) {
        var createdDate = new Date(parseInt("" + userContent.created_time + "000"));
        var singleContentHtml = 
"<div>" +
    "<span style='padding-top: 5px;' class='rantTag'>&lt;!-- Posted: " + createdDate.toLocaleString() + ", <a target='_blank' href='https://devrant.io/rants/" + userContent.id + "'>open in devRant</a> --></span>" +
    "<div class='rantTag'>" +
        "<img onclick='xmlRant.internal.toggleVisibility(this, \"" + userContent.id + "\")' class='toggleImg' src='/images/minus.gif'/>" +
        "&lt;" + xmlRant.type + " user=\"<a target='_blank' href='https://devRant.io/users/" + userContent.user_username + "'>" + userContent.user_username + "</a>\"" +
    "</div> " +
    "<span class='rantProp'>score=\"" + userContent.score + "\"<br/></span> " +
    "<span class='rantProp'>commentCount=\"" + userContent.num_comments + "\"</span>>" +
    "<span id='content_" + userContent.id + "'>" + 
        this.addTags(userContent) + 
    "<span class='rantCdata'>&lt;![CDATA[</span>" +
    "<div class='rantContent mainBody'>" + xmlRant.internal.escapeHtml(userContent.text) + "</div>" +
    "<span class='rantCdata'>]]></span>" +
        this.addImage(userContent) + 
        this.addCollapsedComments(userContent) +
    "</span>" +
    "<div class='rantTag'>&lt;/" + xmlRant.type + "></div>" +
"</div>";
        return singleContentHtml;
    },
    addCollapsedComments: function(uc) {
        var res = '';
        if (uc != null && uc.num_comments > 0) {
            res = 
"<div class='rantProp'>" +
    "<img onclick='xmlRant.internal.toggleVisibility(this, \"" + uc.id + "_comments\")' class='toggleImg' src='/images/minus.gif'/>" +
    "&lt;comments>" +
        "<span id='content_" + uc.id + "_comments'>" +
            "<div class='rantColl'>" +
                "<a href='javascript:void(0);' onclick='xmlRant.content.expandComments(\"" + xmlRant.progressSelector + "\", this, " + uc.id + ");'>(click to load)</a>" +
            "</div>" +
        "</span>" +
    "&lt;/comments>" +
"</div>";
        }
        return res;
    },
    expandComments: function(progressIndicatorSelector, el, rantId) {
        $target = $(el).parent();
        $target.text("Loading!..");
        var result = '';
        $.ajax({
            type: 'GET',
            url: '/home/GetRant',
            data: { "rantId": rantId },
            dataType: 'json',
            success: function (data) {
                if (data != null) {
                    if (data.success) {
                        for (var i = 0; i < data.comments.length; i++) {
                            var comment = data.comments[i];
                            result += 
"&lt;comment user=\"<a target='_blank' href='https://www.devrant.io/users/" + comment.user_username + "'>" + comment.user_username + 
    "</a>\" score=\"" + comment.score + "\">" +
    "<br/>" +
    "<span class='rantColl'>&lt;![CDATA[</span>" +
    "<div class='rantTag mainBody'>" + comment.body + "</div>" +
    "<span class='rantColl'>]]></span>" +
    "<br/>" +
"&lt;/comment>" +
"<br/>";
                        }
                    }
                }
            },
            beforeSend : function() {
                $(progressIndicatorSelector).show();
            },
            complete : function() {
                $(progressIndicatorSelector).hide();
                $target.html(result);
                if (Prism != null) {
                    Prism.highlightElement($target[0]);
                }
            },
            error: function(err) {
                $(progressIndicatorSelector).hide();
                console.log(err);
            }
        });
    },
    addTags: function(uc) {
        var res = '(dev/null)';
        if (uc.tags != null && uc.tags.length > 0) {
            res = '';
            for (var i = 0; i < uc.tags.length; i++) {
                res += (uc.tags[i] + '; ');
            }
            res = res.trim();
        }
        res = "<div class='rantProp'>&lt;tags>" + res + "&lt;/tags></div>";
        return res;
    },
    addImage: function(uc) {
        var res = '';
        //console.log(uc);
        if (uc.attached_image != null) {
            res = 
"<div class='rantProp'>" +
    "&lt;imageUrl>" +
        "<span class='imgWrapper'>" +
            "<a href='javascript:void(0);' onclick='xmlRant.content.openImage(this)'>" + xmlRant.internal.escapeHtml(uc.attached_image.url) + 
                "<img alt='' src='" + uc.attached_image.url + "' />" +
            "</a>" +
    "&lt;/imageUrl>" +
"</div>";
        }
        return res;
    },
    openImage: function(el) {
        xmlRant.productOverlayImage.attr('src', el.innerText);
        xmlRant.productOverlay.fadeIn(100);
        $('body').css('overflow', 'hidden');
    
        $('.product-image-overlay-close, .product-image-overlay').click(function () {
            xmlRant.productOverlay.fadeOut(100);
            $('body').css('overflow', 'auto');
        });
    }
};