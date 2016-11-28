import re
import numpy as np


# Remove stopwords and transform to lowercase
def getwords(text):
    from nltk.corpus import stopwords
    from nltk.tokenize import TweetTokenizer

    tokenizer = TweetTokenizer()
    stop = set(stopwords.words('english'))
    return " ".join([re.sub(r'\W+', '', i.lower()) for i in tokenizer.tokenize(text) if i not in stop and len(i) > 3])


def preprocess(data):
    return " ".join([getwords(d) for d in data])


def print_top_words(model, feature_names, n_top_words):
    for topic_idx, topic in enumerate(model.components_):
        print("Topic #%d:" % topic_idx)
        print(" ".join([feature_names[i]
                        for i in topic.argsort()[:-n_top_words - 1:-1]]))
    print()


def showfeatures(w, h, titles, wordvec):
    features = [(sorted(zip(feature, wordvec), reverse=True))[:6] for feature in np.array(h)]
    article_features = zip(
        [sorted(zip(article, range(len(article))), reverse=True)[:2] for article in np.array(w)],
        titles)
    for feature_weights, article in article_features:
        print(feature_weights, article)
        for weight, feature_index in feature_weights:
            print('-------', list(zip(*features[feature_index]))[1])


def concat_list_with_window(old, new, window):
    return [" ".join(getwords(tweet)) for tweet in (new + old)[:window]]


def nnmf(A):
    from sklearn.decomposition import NMF
    nmf = NMF(n_components=10, random_state=1,
              alpha=.1, l1_ratio=.5).fit(A)

    W = nmf.fit_transform(A)
    H = nmf.components_
    return W, H


def find_topics(feeds, previous_feeds=None, window=100):
    from sklearn.feature_extraction.text import TfidfVectorizer

    data = feeds

    if previous_feeds:
        data = [concat_list_with_window(feed, previous_feed, window) for feed, previous_feed in
                zip(feeds, previous_feeds)]

    preprocessed_data = np.array([preprocess(d) for d in data])

    tfidf_vectorizer = TfidfVectorizer(max_df=0.8, min_df=2,
                                       max_features=10,
                                       stop_words='english')

    tfidf = tfidf_vectorizer.fit_transform(preprocessed_data)

    tfidf_feature_names = tfidf_vectorizer.get_feature_names()
    W, H = nnmf(tfidf)
    return W, H, tfidf_feature_names
