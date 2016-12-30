import re
from nltk.corpus import stopwords, wordnet
from nltk.tokenize import TweetTokenizer
from nltk.stem import WordNetLemmatizer
from nltk.tag import pos_tag

custom_stopwords = {'dont', 'great', 'this', 'like', 'it', 'next', 'ive', 'http', 'thanks', 'much', 'what', 'with',
                    'were', 'need', 'more', 'word', 'say', 'here', 'very', 'these', 'take', 'stuff', 'youre', 'every',
                    'isnt', 'come', 'week', 'thanks', 'with', 'week', 'year', 'day', 'great', 'thats', 'today',
                    'tomorrow', 'could', 'please', 'really', 'tonight', 'first', 'coming', 'though', 'although',
                    'amazing', 'awesome', 'might', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
                    'sunday', 'weekend', 'month', 'using', 'night', 'going', 'people', 'thing', 'still', "think",
                    "looking", "right", "better", "thought", "twitter", "never", "sound", "getting", "always", "tweet",
                    "thank", "morning", "happy", "maybe", "pretty", "someone", "actually", "interesting", "little",
                    "sorry", "quite", "point", "working", "start", "email", "tryin", 'medium', 'another'}

irrelevant_word_types = ['ADP', 'ADV', 'CONJ', 'DET', 'NUM', 'PRT', 'PRON']


# Remove stopwords and transform to lowercase
def getwords(text):
    wnl = WordNetLemmatizer()
    tokenizer = TweetTokenizer(strip_handles=True, reduce_len=True)
    stop = set(stopwords.words('english')) | custom_stopwords
    tokens = [wnl.lemmatize(re.sub(r'\W+', '', i.lower())) for i in tokenizer.tokenize(text)]
    filtered_tokens = [token for token in tokens if token
                       and not re.match('^-?[0-9]+$', token)
                       and not re.match('^http.*', token)
                       and token not in stop
                       and wordnet.synsets(token)
                       and len(token) > 4 and len(token) < 15]
    tagged_tokens = pos_tag(filtered_tokens)
    return [token for token, pos in tagged_tokens if pos not in irrelevant_word_types]
