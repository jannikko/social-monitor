import numpy as np
import re
from nltk.corpus import stopwords
from sklearn.decomposition import NMF
from nltk import word_tokenize


# Remove stopwords and transform to lowercase
def getwords(text):
    stop = set(stopwords.words('english'))
    return [re.sub(r'\W+', '', i.lower()) for i in word_tokenize(text) if i not in stop and len(i) > 3]


def findIrrelevant(words, min_frequency, max_percentage):
    word_sum = sum(words.values())
    return {word for word, frequency in words.items() if
            frequency <= min_frequency or float(frequency) / word_sum > max_percentage}


def getarticlewords(accounts):
    allwords = dict()
    articlewords = list()
    articletitles = list()
    for account in accounts:
        words = getwords(' '.join(account['feed']))
        articleword = dict()
        for word in words:
            if word in articleword:
                articleword[word] += 1
            else:
                articleword[word] = 1

            if word in allwords:
                allwords[word] += 1
            else:
                allwords[word] = 1

        articlewords.append(articleword)
        articletitles.append(account['username'])

    return allwords, np.array(articlewords), np.array(articletitles)


def makematrix(allwords, articlewords):
    words = list(allwords)
    article_word_matrix = np.zeros((len(articlewords), len(words)))
    for i in range(len(article_word_matrix)):
        row = article_word_matrix[i]
        current_articlewords = articlewords[i]
        for word in current_articlewords.keys():
            row[words.index(word)] = current_articlewords[word]
    return np.matrix(article_word_matrix), words


def nnmf(A, m, it):
    nmf_model = NMF(n_components=m, init='random', random_state=0, max_iter=it)
    W = nmf_model.fit_transform(A)
    H = nmf_model.components_
    return (W, H)


def showfeatures(w, h, titles, wordvec):
    features = [(sorted(zip(feature, wordvec), reverse=True))[:6] for feature in np.array(h)]
    article_features = zip(
        [sorted(zip(article, range(len(article))), reverse=True)[:2] for article in np.array(w)],
        titles)
    for feature_weights, article in article_features:
        print(feature_weights, article)
        for weight, feature_index in feature_weights:
            print('-------', list(zip(*features[feature_index]))[1])
