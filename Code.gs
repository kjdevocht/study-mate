/**
 *
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */
 
/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Start', 'showSidebar')
      .addToUi();
}

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('LDS Study Mate');
  DocumentApp.getUi().showSidebar(ui);
}

function insertQR(){
  var doc = DocumentApp.getActiveDocument()
  var publicLink = encodeURI(doc.getUrl());
  var url = 'https://api.qrserver.com/v1/create-qr-code/?data='+publicLink+'&size=100x100';
  var response = UrlFetchApp.fetch(url);
  Logger.log(response);
  
  var cursor = doc.getCursor();
  if (cursor) {
    var element = cursor.insertInlineImage(response.getBlob());
    if (!element) {
      DocumentApp.getUi().alert('Cannot insert image here.');
    }
  } else {
    DocumentApp.getUi().alert('Cannot find a cursor.');
  }
}



function processLink() {
  var ldsUrl = 'https?:\/\/www\.lds.org\/[-a-zA-Z0-9@:%_\+.~#?&//=]*'
  var body = DocumentApp.getActiveDocument().getBody();
  var foundElement = body.findText(ldsUrl);

    while (foundElement != null) {
        // Get the text object from the element
        var foundText = foundElement.getElement().asText();
        var start = foundElement.getStartOffset();
        var end = foundElement.getEndOffsetInclusive();
      
        //foundText.setBackgroundColor(start, end, "#FCFC00");
        var url = foundText.getText().substring(start, end+1);
        Logger.log("URL " + url);
      
        var scripture = parseUrl(url);

      
        foundText.replaceText(url,scripture);
      
        var foundTextElement = body.findText(scripture);
        var foundText = foundTextElement.getElement().asText();
      
        // Where in the Element is the found text?
        var textStart = foundTextElement.getStartOffset();
        var textEnd = foundTextElement.getEndOffsetInclusive();
      
        foundText.setLinkUrl(textStart, textEnd, url);
      

        // Find the next match
        foundElement = body.findText(ldsUrl);
    }
  processReference();
}


function processReference(){
  var ldsRef = '[SongfWrdsM\ ]*[1-4]?\ ?[a-zA-Z&]+\ [0-9]+:[0-9,-–]*[0-9]';
  var testLdsRef = '(((Song of\ )|(Words of\ )|([1-4]\ ))?[a-zA-Z&]+\ [0-9]+:[0-9,-–]*[0-9])';
  var body = DocumentApp.getActiveDocument().getBody();
  //var body = DocumentApp.openById('1yhrznKnZcltiTDXzBcYM9AajIuVcOJIuxupsCSf6GA4').getBody();
  
  var paragraphs = body.getParagraphs();
  for (var i=0; i<paragraphs.length; i++) {
    var text = paragraphs[i].getText();
    var refs = text.match(/(((Song of\ )|(Words of\ )|([1-4]\ ))?[a-zA-Z&]+\ [0-9]+:[0-9,-–]*[0-9])/g);
    if(refs){
      for (var j=0; j<refs.length; j++) {
        var foundElement = body.findText(refs[j]);
        while (foundElement != null) {
          // Get the text object from the element
          var foundText = foundElement.getElement().asText();
          var start = foundElement.getStartOffset();
          var end = foundElement.getEndOffsetInclusive();
      
          //foundText.setBackgroundColor(start, end, "#FCFC00");
          var ref = foundText.getText().substring(start, end+1);
          var url = foundText.getLinkUrl(start);
          if(url === null){
            var newUrl = parseRef(ref);
            foundText.setLinkUrl(start, end, newUrl);
          }
        
          Logger.log("REF " + ref);

          // Find the next match
          foundElement = body.findText(refs[j], foundElement);
        }
      }
    }    
  }
}



function parseUrl(url){
  //url = "https://www.lds.org/scriptures/bofm/1-ne/3.4#3";
  var urlPieces = url.split('/')
  var test = 1;
  var book = processBookName(urlPieces[urlPieces.length-2]);
  var chapAndVerse = urlPieces[urlPieces.length-1];
  var chapPieces = chapAndVerse.split('.');
  var chapter = chapPieces[0];
  var versePieces = chapPieces[1].split('#');
  var verses = versePieces[0];
  var scripture = book+" "+chapter+":"+verses;
  
  return scripture;
}

function parseRef(ref){
  //ref = "Abraham 3:22–24";
  var refPieces = ref.split(' ');
  var book;
  if(refPieces.length > 3){
    book = book = refPieces[0] + " " + refPieces[1] + " " + refPieces[2];
    refPieces.splice(0, 2);
  }
  else if(refPieces.length > 2){
    book = book = refPieces[0] + " " + refPieces[1];
    refPieces.splice(0, 1);
  }
  else{
    book = refPieces[0];
  }
  
  var chapterPieces = refPieces[1].split(':');
  var chapter = chapterPieces[0];
  var verses = chapterPieces[1];
  var versePieces = verses.split(/\D/);
  var anchor = versePieces[0]-1;
  
  book = book.toLowerCase().trim();
  var url = "https://www.lds.org/scriptures/";
  var path = getBookNamefromWholeName(book);
  if(path === "not found"){
    path = getBookNamefromAbr(book);
  }
  else{
    book = convertBookNametoUrlName(book); 
  }
  
  url = url+path+"/"+book+"/"+chapter+"."+verses+"#"+anchor;
  return url;
}

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function getBookNamefromWholeName(book){
   
  var newBookName;
  
  switch(book){
    case "genesis":
      newBookName = 'ot';
      break;
    case "exodus":
      newBookName = 'ot';
      break;
    case "leviticus":
      newBookName = 'ot';
      break;
    case "numbers":
      newBookName = 'ot';
      break;
     case "deuteronomy":
      newBookName = 'ot';
      break;
     case "joshua":
      newBookName = 'ot';
      break;
     case "judges":
      newBookName = 'ot';
      break;
     case "ruth":
      newBookName = 'ot';
      break;
     case "1 samuel":
      newBookName = 'ot';
      break;
     case "2 samuel":
      newBookName = 'ot';
      break;
     case "1 kings":
      newBookName = 'ot';
      break;
     case "2 kings":
      newBookName = 'ot';
      break;
     case "1 chronicles":
      newBookName = 'ot';
      break;
     case "2 chronicles":
      newBookName = 'ot';
      break;
     case "ezra":
      newBookName = 'ot';
      break;
     case "nehemiah":
      newBookName = 'ot';
      break;
     case "esther":
      newBookName = 'ot';
      break;
     case "job":
      newBookName = 'ot';
      break;
     case "psalms":
      newBookName = 'ot';
      break;
     case "proverbs":
      newBookName = 'ot';
      break;
     case "ecclesiastes":
      newBookName = 'ot';
      break;
     case "song of solomon":
      newBookName = 'ot';
      break;
     case "isaiah":
      newBookName = 'ot';
      break;
     case "jeremiah":
      newBookName = 'ot';
      break;
     case "lamentations":
      newBookName = 'ot';
      break;
     case "ezekiel":
      newBookName = 'ot';
      break;
     case "daniel":
      newBookName = 'ot';
      break;
     case "hosea":
      newBookName = 'ot';
      break;
     case "joel":
      newBookName = 'ot';
      break;
     case "amos":
      newBookName = 'ot';
      break;
     case "obadiah":
      newBookName = 'ot';
      break;
     case "jonah":
      newBookName = 'ot';
      break;
     case "micah":
      newBookName = 'ot';
      break;
     case "nahum":
      newBookName = 'ot';
      break;
     case "habakkuk":
      newBookName = 'ot';
      break;
     case "zephaniah":
      newBookName = 'ot';
      break;
     case "haggai":
      newBookName = 'ot';
      break;
     case "zechariah":
      newBookName = 'ot';
      break;
     case "malachi":
      newBookName = 'ot';
      break;
     case "matthew":
      newBookName = 'nt';
      break;
     case "mark":
      newBookName = 'nt';
      break;
     case "luke":
      newBookName = 'nt';
      break;
     case "john":
      newBookName = 'nt';
      break;
     case "acts":
      newBookName = 'nt';
      break;
     case "romans":
      newBookName = 'nt';
      break;
     case "1 corinthians":
      newBookName = 'nt';
      break;
     case "2 corinthians":
      newBookName = 'nt';
      break;
     case "galatians":
      newBookName = 'nt';
      break;
     case "ephesians":
      newBookName = 'nt';
      break;
     case "philippians":
      newBookName = 'nt';
      break;
     case "colossians":
      newBookName = 'nt';
      break;
     case "1 thessalonians":
      newBookName = 'nt';
      break;
     case "2 thessalonians":
      newBookName = 'nt';
      break;
     case "1 timothy":
      newBookName = 'nt';
      break;
     case "2 timothy":
      newBookName = 'nt';
      break;
     case "titus":
      newBookName = 'nt';
      break;
     case "philemon":
      newBookName = 'nt';
      break;
     case "hebrews":
      newBookName = 'nt';
      break;
     case "james":
      newBookName = 'nt';
      break;
     case "1 peter":
      newBookName = 'nt';
      break;
     case "2 peter":
      newBookName = 'nt';
      break;
     case "1 john":
      newBookName = 'nt';
      break;
     case "2 john":
      newBookName = 'nt';
      break;
     case "3 john":
      newBookName = 'nt';
      break;
     case "jude":
      newBookName = 'nt';
      break;
     case "revelation":
      newBookName = 'nt';
      break;
     case "1 nephi":
      newBookName = 'bofm';
      break;
     case "2 nephi":
      newBookName = 'bofm';
      break;
     case "jacob":
      newBookName = 'bofm';
      break;
     case "enos":
      newBookName = 'bofm';
      break;
     case "jarom":
      newBookName = 'bofm';
      break;
     case "omni":
      newBookName = 'bofm';
      break;
     case "words of mormon":
      newBookName = 'bofm';
      break;
     case "mosiah":
      newBookName = 'bofm';
      break;
     case "alma":
      newBookName = 'bofm';
      break;
     case "helaman":
      newBookName = 'bofm';
      break;
     case "3 nephi":
      newBookName = 'bofm';
      break;
     case "4 nephi":
      newBookName = 'bofm';
      break;
     case "mormon":
      newBookName = 'bofm';
      break;
     case "ether":
      newBookName = 'bofm';
      break;
     case "moroni":
      newBookName = 'bofm';
      break;
     case "d&c":
      newBookName = 'dc-testament';
      break;
     case "od":
      newBookName = 'Official Declaration';
      break;
     case "moses":
      newBookName = 'pgp';
      break;
     case "abraham":
      newBookName = 'pgp';
      break;
     case "jsm":
      newBookName = 'pgp';
      break;
     case "jsh":
      newBookName = 'pgp';
      break;
     case "aoff":
      newBookName = 'pgp';
      break;
    default:
      newBookName = "not found";
  }
  
  return newBookName;
}

function getBookNamefromAbr(book){
var newBookName;
  
  switch(book){
    case "gen":
      newBookName = 'ot';
      break;
    case "ex":
      newBookName = 'ot';
      break;
    case "lev":
      newBookName = 'ot';
      break;
    case "num":
      newBookName = 'ot';
      break;
     case "deut":
      newBookName = 'ot';
      break;
     case "josh":
      newBookName = 'ot';
      break;
     case "judg":
      newBookName = 'ot';
      break;
     case "ruth":
      newBookName = 'ot';
      break;
     case "1-sam":
      newBookName = 'ot';
      break;
     case "2-sam":
      newBookName = 'ot';
      break;
     case "1-kgs":
      newBookName = 'ot';
      break;
     case "2-kgs":
      newBookName = 'ot';
      break;
     case "1-chr":
      newBookName = 'ot';
      break;
     case "2-chr":
      newBookName = 'ot';
      break;
     case "ezra":
      newBookName = 'ot';
      break;
     case "neh":
      newBookName = 'ot';
      break;
     case "esth":
      newBookName = 'ot';
      break;
     case "job":
      newBookName = 'ot';
      break;
     case "ps":
      newBookName = 'ot';
      break;
     case "prov":
      newBookName = 'ot';
      break;
     case "eccl":
      newBookName = 'ot';
      break;
     case "song":
      newBookName = 'ot';
      break;
     case "isa":
      newBookName = 'ot';
      break;
     case "jer":
      newBookName = 'ot';
      break;
     case "lam":
      newBookName = 'ot';
      break;
     case "ezek":
      newBookName = 'ot';
      break;
     case "dan":
      newBookName = 'ot';
      break;
     case "hosea":
      newBookName = 'ot';
      break;
     case "joel":
      newBookName = 'ot';
      break;
     case "amos":
      newBookName = 'ot';
      break;
     case "obad":
      newBookName = 'ot';
      break;
     case "jonah":
      newBookName = 'ot';
      break;
     case "micah":
      newBookName = 'ot';
      break;
     case "nahum":
      newBookName = 'ot';
      break;
     case "hab":
      newBookName = 'ot';
      break;
     case "zeph":
      newBookName = 'ot';
      break;
     case "hag":
      newBookName = 'ot';
      break;
     case "zech":
      newBookName = 'ot';
      break;
     case "mal":
      newBookName = 'ot';
      break;
     case "matt":
      newBookName = 'nt';
      break;
     case "mark":
      newBookName = 'nt';
      break;
     case "luke":
      newBookName = 'nt';
      break;
     case "john":
      newBookName = 'nt';
      break;
     case "acts":
      newBookName = 'nt';
      break;
     case "rom":
      newBookName = 'nt';
      break;
     case "1-cor":
      newBookName = 'nt';
      break;
     case "2-cor":
      newBookName = 'nt';
      break;
     case "gal":
      newBookName = 'nt';
      break;
     case "eph":
      newBookName = 'nt';
      break;
     case "philip":
      newBookName = 'nt';
      break;
     case "col":
      newBookName = 'nt';
      break;
     case "1-thes":
      newBookName = 'nt';
      break;
     case "2-thes":
      newBookName = 'nt';
      break;
     case "1-tim":
      newBookName = 'nt';
      break;
     case "2-tim":
      newBookName = 'nt';
      break;
     case "titus":
      newBookName = 'nt';
      break;
     case "philem":
      newBookName = 'nt';
      break;
     case "heb":
      newBookName = 'nt';
      break;
     case "james":
      newBookName = 'nt';
      break;
     case "1-pet":
      newBookName = 'nt';
      break;
     case "2-pet":
      newBookName = 'nt';
      break;
     case "1-jn":
      newBookName = 'nt';
      break;
     case "2-jn":
      newBookName = 'nt';
      break;
     case "3-jn":
      newBookName = 'nt';
      break;
     case "jude":
      newBookName = 'nt';
      break;
     case "rev":
      newBookName = 'nt';
      break;
     case "1-ne":
      newBookName = 'bofm';
      break;
     case "2-ne":
      newBookName = 'bofm';
      break;
     case "jacob":
      newBookName = 'bofm';
      break;
     case "enos":
      newBookName = 'bofm';
      break;
     case "jarom":
      newBookName = 'bofm';
      break;
     case "omni":
      newBookName = 'bofm';
      break;
     case "w-of-m":
      newBookName = 'bofm';
      break;
     case "mosiah":
      newBookName = 'bofm';
      break;
     case "alma":
      newBookName = 'bofm';
      break;
     case "hel":
      newBookName = 'bofm';
      break;
     case "3-ne":
      newBookName = 'bofm';
      break;
     case "4-ne":
      newBookName = 'bofm';
      break;
     case "morm":
      newBookName = 'bofm';
      break;
     case "ether":
      newBookName = 'bofm';
      break;
     case "moro":
      newBookName = 'bofm';
      break;
     case "dc":
      newBookName = 'dc';
      break;
     case "d&c":
      newBookName = 'dc';
      break;
     case "od":
      newBookName = 'od';
      break;
     case "moses":
      newBookName = 'pgp';
      break;
     case "abr":
      newBookName = 'pgp';
      break;
     case "js-m":
      newBookName = 'pgp';
      break;
     case "js-h":
      newBookName = 'pgp';
      break;
     case "a-of-f":
      newBookName = 'pgp';
      break;
    default:
      newBookName = "not found";
  }
  
  return newBookName;
}

function processBookName(bookName){
  
  var newBookName;
  
  switch(bookName){
    case "gen":
      newBookName = 'Genesis';
      break;
    case "ex":
      newBookName = 'Exodus';
      break;
    case "lev":
      newBookName = 'Leviticus';
      break;
    case "num":
      newBookName = 'Numbers';
      break;
     case "deut":
      newBookName = 'Deuteronomy';
      break;
     case "josh":
      newBookName = 'Joshua';
      break;
     case "judg":
      newBookName = 'Judges';
      break;
     case "ruth":
      newBookName = 'Ruth';
      break;
     case "1-sam":
      newBookName = '1 Samuel';
      break;
     case "2-sam":
      newBookName = '2 Samuel';
      break;
     case "1-kgs":
      newBookName = '1 Kings';
      break;
     case "2-kgs":
      newBookName = '2 Kings';
      break;
     case "1-chr":
      newBookName = '1 Chronicles';
      break;
     case "2-chr":
      newBookName = '2 Chronicles';
      break;
     case "ezra":
      newBookName = 'Ezra';
      break;
     case "neh":
      newBookName = 'Nehemiah';
      break;
     case "esth":
      newBookName = 'Esther';
      break;
     case "job":
      newBookName = 'Job';
      break;
     case "ps":
      newBookName = 'Psalms';
      break;
     case "prov":
      newBookName = 'Proverbs';
      break;
     case "eccl":
      newBookName = 'Ecclesiastes';
      break;
     case "song":
      newBookName = 'Song of Solomon';
      break;
     case "isa":
      newBookName = 'Isaiah';
      break;
     case "jer":
      newBookName = 'Jeremiah';
      break;
     case "lam":
      newBookName = 'Lamentations';
      break;
     case "ezek":
      newBookName = 'Ezekiel';
      break;
     case "dan":
      newBookName = 'Daniel';
      break;
     case "hosea":
      newBookName = 'Hosea';
      break;
     case "joel":
      newBookName = 'Joel';
      break;
     case "amos":
      newBookName = 'Amos';
      break;
     case "obad":
      newBookName = 'Obadiah';
      break;
     case "jonah":
      newBookName = 'Jonah';
      break;
     case "micah":
      newBookName = 'Micah';
      break;
     case "nahum":
      newBookName = 'Nahum';
      break;
     case "hab":
      newBookName = 'Habakkuk';
      break;
     case "zeph":
      newBookName = 'Zephaniah';
      break;
     case "hag":
      newBookName = 'Haggai';
      break;
     case "zech":
      newBookName = 'Zechariah';
      break;
     case "mal":
      newBookName = 'Malachi';
      break;
     case "matt":
      newBookName = 'Matthew';
      break;
     case "mark":
      newBookName = 'Mark';
      break;
     case "luke":
      newBookName = 'Luke';
      break;
     case "john":
      newBookName = 'John';
      break;
     case "acts":
      newBookName = 'Acts';
      break;
     case "rom":
      newBookName = 'Romans';
      break;
     case "1-cor":
      newBookName = '1 Corinthians';
      break;
     case "2-cor":
      newBookName = '2 Corinthians';
      break;
     case "gal":
      newBookName = 'Galatians';
      break;
     case "eph":
      newBookName = 'Ephesians';
      break;
     case "philip":
      newBookName = 'Philippians';
      break;
     case "col":
      newBookName = 'Colossians';
      break;
     case "1-thes":
      newBookName = '1 Thessalonians';
      break;
     case "2-thes":
      newBookName = '2 Thessalonians';
      break;
     case "1-tim":
      newBookName = '1 Timothy';
      break;
     case "2-tim":
      newBookName = '2 Timothy';
      break;
     case "titus":
      newBookName = 'Titus';
      break;
     case "philem":
      newBookName = 'Philemon';
      break;
     case "heb":
      newBookName = 'Hebrews';
      break;
     case "james":
      newBookName = 'James';
      break;
     case "1-pet":
      newBookName = '1 Peter';
      break;
     case "2-pet":
      newBookName = '2 Peter';
      break;
     case "1-jn":
      newBookName = '1 John';
      break;
     case "2-jn":
      newBookName = '2 John';
      break;
     case "3-jn":
      newBookName = '3 John';
      break;
     case "jude":
      newBookName = 'Jude';
      break;
     case "rev":
      newBookName = 'Revelation';
      break;
     case "1-ne":
      newBookName = '1 Nephi';
      break;
     case "2-ne":
      newBookName = '2 Nephi';
      break;
     case "jacob":
      newBookName = 'Jacob';
      break;
     case "enos":
      newBookName = 'Enos';
      break;
     case "jarom":
      newBookName = 'Jarom';
      break;
     case "omni":
      newBookName = 'Omni';
      break;
     case "w-of-m":
      newBookName = 'Words of Mormon';
      break;
     case "mosiah":
      newBookName = 'Mosiah';
      break;
     case "alma":
      newBookName = 'Alma';
      break;
     case "hel":
      newBookName = 'Helaman';
      break;
     case "3-ne":
      newBookName = '3 Nephi';
      break;
     case "4-ne":
      newBookName = '4 Nephi';
      break;
     case "morm":
      newBookName = 'Mormon';
      break;
     case "ether":
      newBookName = 'Ether';
      break;
     case "moro":
      newBookName = 'Moroni';
      break;
     case "dc":
      newBookName = 'D&C';
      break;
     case "od":
      newBookName = 'Official Declaration';
      break;
     case "moses":
      newBookName = 'Moses';
      break;
     case "abr":
      newBookName = 'Abraham';
      break;
     case "js-m":
      newBookName = 'Joseph Smith—Matthew';
      break;
     case "js-h":
      newBookName = 'Joseph Smith—History';
      break;
     case "a-of-f":
      newBookName = 'The Articles of Faith';
      break;
    default:
      newBookName = bookName;
  }
  
  return newBookName;
}

function convertBookNametoUrlName(bookName){
  
  var newBookName;
  
  switch(bookName){
    case "genesis":
      newBookName = 'gen';
      break;
    case "exodus":
      newBookName = 'ex';
      break;
    case "leviticus":
      newBookName = 'lev';
      break;
    case "numbers":
      newBookName = 'num';
      break;
     case "deuteronomy":
      newBookName = 'deut';
      break;
     case "joshua":
      newBookName = 'josh';
      break;
     case "judges":
      newBookName = 'judg';
      break;
     case "ruth":
      newBookName = 'ruth';
      break;
     case "1 samuel":
      newBookName = '1-sam';
      break;
     case "2 samuel":
      newBookName = '2-sam';
      break;
     case "1 kings":
      newBookName = '1-kgs';
      break;
     case "2 kings":
      newBookName = '2-kgs';
      break;
     case "1 chronicles":
      newBookName = '1-chr';
      break;
     case "2 chronicles":
      newBookName = '2-chr';
      break;
     case "ezra":
      newBookName = 'ezra';
      break;
     case "nehemiah":
      newBookName = 'neh';
      break;
     case "esther":
      newBookName = 'esth';
      break;
     case "job":
      newBookName = 'job';
      break;
     case "psalms":
      newBookName = 'ps';
      break;
     case "proverbs":
      newBookName = 'prov';
      break;
     case "ecclesiastes":
      newBookName = 'eccl';
      break;
     case "song of solomon":
      newBookName = 'song';
      break;
     case "isaiah":
      newBookName = 'isa';
      break;
     case "jeremiah":
      newBookName = 'jer';
      break;
     case "lamentations":
      newBookName = 'lam';
      break;
     case "ezekiel":
      newBookName = 'ezek';
      break;
     case "daniel":
      newBookName = 'dan';
      break;
     case "hosea":
      newBookName = 'hosea';
      break;
     case "joel":
      newBookName = 'joel';
      break;
     case "amos":
      newBookName = 'amos';
      break;
     case "obadiah":
      newBookName = 'obad';
      break;
     case "jonah":
      newBookName = 'jonah';
      break;
     case "micah":
      newBookName = 'micah';
      break;
     case "nahum":
      newBookName = 'nahum';
      break;
     case "habakkuk":
      newBookName = 'hab';
      break;
     case "zephaniah":
      newBookName = 'zeph';
      break;
     case "haggai":
      newBookName = 'hag';
      break;
     case "zechariah":
      newBookName = 'zech';
      break;
     case "malachi":
      newBookName = 'mal';
      break;
     case "matthew":
      newBookName = 'matt';
      break;
     case "mark":
      newBookName = 'mark';
      break;
     case "luke":
      newBookName = 'luke';
      break;
     case "john":
      newBookName = 'john';
      break;
     case "acts":
      newBookName = 'acts';
      break;
     case "romans":
      newBookName = 'rom';
      break;
     case "1 corinthians":
      newBookName = '1-cor';
      break;
     case "2 corinthians":
      newBookName = '2-cor';
      break;
     case "galatians":
      newBookName = 'gal';
      break;
     case "ephesians":
      newBookName = 'eph';
      break;
     case "philippians":
      newBookName = 'philip';
      break;
     case "colossians":
      newBookName = 'col';
      break;
     case "1 thessalonians":
      newBookName = '1-thes';
      break;
     case "2 thessalonians":
      newBookName = '2-thes';
      break;
     case "1 timothy":
      newBookName = '1-tim';
      break;
     case "2 timothy":
      newBookName = '2-tim';
      break;
     case "titus":
      newBookName = 'titus';
      break;
     case "philemon":
      newBookName = 'philem';
      break;
     case "hebrews":
      newBookName = 'heb';
      break;
     case "james":
      newBookName = 'james';
      break;
     case "1 peter":
      newBookName = '1-pet';
      break;
     case "2 peter":
      newBookName = '2-pet';
      break;
     case "1 john":
      newBookName = '1-jn';
      break;
     case "2 john":
      newBookName = '2-jn';
      break;
     case "3 john":
      newBookName = '3-jn';
      break;
     case "jude":
      newBookName = 'jude';
      break;
     case "revelation":
      newBookName = 'rev';
      break;
     case "1 nephi":
      newBookName = '1-ne';
      break;
     case "2 nephi":
      newBookName = '2-ne';
      break;
     case "jacob":
      newBookName = 'jacob';
      break;
     case "enos":
      newBookName = 'enos';
      break;
     case "jarom":
      newBookName = 'jarom';
      break;
     case "omni":
      newBookName = 'omni';
      break;
     case "words of mormon":
      newBookName = 'w-of-m';
      break;
     case "mosiah":
      newBookName = 'mosiah';
      break;
     case "alma":
      newBookName = 'alma';
      break;
     case "helaman":
      newBookName = 'hel';
      break;
     case "3 nephi":
      newBookName = '3-ne';
      break;
     case "4 nephi":
      newBookName = '4-ne';
      break;
     case "mormon":
      newBookName = 'morm';
      break;
     case "ether":
      newBookName = 'ether';
      break;
     case "moroni":
      newBookName = 'moro';
      break;
     case "d&c":
      newBookName = 'dc';
      break;
     case "official declaration":
      newBookName = 'od';
      break;
     case "moses":
      newBookName = 'moses';
      break;
     case "abraham":
      newBookName = 'abr';
      break;
     case "jsm":
      newBookName = 'js-m';
      break;
     case "jsh":
      newBookName = 'js-h';
      break;
     case "aoff":
      newBookName = 'a-of-f';
      break;
    default:
      newBookName = bookName;
  }
  
  return newBookName;
}
