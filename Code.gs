// Array of RSS feed URLs to parse
var RSS_FEED_URLS = [
  "https://cloudblog.withgoogle.com/products/gcp/rss",
  "https://www.theverge.com/rss/google/index.xml",
  "zdnet.com/topic/google/rss.xml"
];

// Webhook URL of the Hangouts Chat room
var WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/[SPACE_ID]/messages?key=[KEY]";

// When DEBUG is set to true, the topic is not actually posted to the room
var DEBUG = false;

function fetchNews() {
  var lastUpdate = new Date(parseFloat(PropertiesService.getScriptProperties().getProperty("lastUpdate")) || 0);
  Logger.log("Last update: " + lastUpdate);

  var count = 0;
  
  RSS_FEED_URLS.forEach(function(feedUrl) {
    Logger.log("Fetching '" + feedUrl + "'...");
    
    var xml = UrlFetchApp.fetch(feedUrl).getContentText();
    var document = XmlService.parse(xml);
      
    var items = document.getRootElement().getChild('channel').getChildren('item').reverse();
    
    Logger.log(items.length + " entrie(s) found in " + feedUrl);
    
    for (var i = 0; i < items.length; i++) {
      var pubDate = new Date(items[i].getChild('pubDate').getText());
      var title = items[i].getChild("title").getText();
      var description = items[i].getChild("description").getText();
      var link = items[i].getChild("link").getText();
      
      if(DEBUG){
        Logger.log("------ " + (i+1) + "/" + items.length + " ------");
        Logger.log(pubDate);
        Logger.log(title);
        Logger.log(link);
        // Logger.log(description);
        Logger.log("--------------------");
      }

      if(pubDate.getTime() > lastUpdate.getTime()) {
        Logger.log("Posting topic '"+ title +"'...");
        if(!DEBUG){
          postTopic_(title, description, link);
        }
        PropertiesService.getScriptProperties().setProperty("lastUpdate", pubDate.getTime());
        count++;
      }
    }
  });
  
  Logger.log("> " + count + " new(s) posted");
}

function postTopic_(title, description, link) {
  var text = "*" + title + "*" + "\n";
  
  if (description){
    description = stripHtmlTags(description);
    description = decodeHtmlEntities(description);
    text += description + "\n";
  }
  
  text += link;
  
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify({
      "text": text 
    })
  };
  
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}

function stripHtmlTags(str) {
  if ((str===null) || (str===''))
    return false;
  else
    str = str.toString();
    
  return str.replace(/<[^>]*>/g, '');
}

function decodeHtmlEntities(str) {
  if ((str===null) || (str===''))
    return false;
  else
    str = str.toString();
  
  var doc = XmlService.parse('<html>' + str + '</html>');
  var decodedStr = XmlService.getRawFormat().format(doc.getRootElement());
  
  return decodedStr.substring(6, decodedStr.length - 7); // Remove <html> and </html> tags
}
