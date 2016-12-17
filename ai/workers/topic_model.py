from gensim.corpora import Dictionary, MmCorpus
from gensim.models.ldamodel import LdaModel
from preprocess import getwords
from pyLDAvis import gensim
from enums import SOURCES
from itertools import chain
from sklearn.cluster import DBSCAN
from sklearn.manifold import TSNE
from matplotlib import pyplot as plt
from models import engine
import models.account
import models.topic
import models.topic_model
import models.timeline
import matplotlib.patches as mpatches
import numpy as np
import logging
import pyLDAvis

logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

NUM_TOPICS = 30
NUM_TOPIC_WORDS = 10


def calculate_topics(application_id):
    with engine.begin() as connection:
        accounts = models.account.select_multiple_complete(application_id, SOURCES['TWITTER'], connection)
        topic_model = models.topic_model.select_latest(application_id, SOURCES['TWITTER'], connection)
        lda_model = LdaModel.load('lda_model/ldamodel')
        dictionary = Dictionary.load('lda_model/dictionary')
        for account in accounts:
            timeline = (getwords(status['text']) for status in models.timeline.select_one(account['id'], connection))
            bow = dictionary.doc2bow(chain.from_iterable(timeline))
            weights = getDocumentTopicWeights(lda_model, bow)
            models.topic.insert_one(account['id'], weights, topic_model['id'], connection)


def get_top_cluster_topics(weights_matrix, limit=3):
    average = np.average(weights_matrix, axis=0)
    indices = zip(*sorted([(weight, i) for i, weight in enumerate(average)], reverse=True)[:limit])
    return list(indices)[1]


def get_all_top_cluster_topics(cluster_elements, limit=3):
    return {cluster: get_top_cluster_topics(elements, limit) for cluster, elements in cluster_elements.items()}


def get_cluster_elements(weights_matrix, clusters):
    cluster_elements = {}
    for i, cluster in enumerate(clusters):
        if cluster in cluster_elements:
            cluster_elements[cluster].append(weights_matrix[i])
        else:
            cluster_elements[cluster] = [weights_matrix[i], ]
    return cluster_elements


def format_cluster_label(cluster, top_cluster_topics, topic_words):
    return [topic_words[index][:2] for index in top_cluster_topics[cluster]]


def plot_accounts(cluster_labels, coordinate_matrix, weights_matrix, topic_words):
    cluster_elements = get_cluster_elements(weights_matrix, cluster_labels)
    top_cluster_topics = get_all_top_cluster_topics(cluster_elements, 3)

    # Array of unique cluster labels
    unique_labels = set(cluster_labels)

    # Assign a new color to every unique cluster
    colors = plt.cm.Spectral(np.linspace(0, 1, len(unique_labels)))

    # Create a helper function that returns the same colors for each cluster
    colorMap = {key: value for (key, value) in zip(unique_labels, colors)}

    def getClustorColor(label):
        if label in colorMap:
            return colorMap[label]
        else:
            return 'b'

    # Set up patches for the legend
    patches = [mpatches.Patch(color=getClustorColor(label),
                              label=format_cluster_label(label, top_cluster_topics, topic_words)) for
               label in unique_labels]

    for coords, label in zip(coordinate_matrix, cluster_labels):
        plt.plot(coords[0], coords[1], 'o', markerfacecolor=getClustorColor(label),
                 markersize=7)

    plt.legend(handles=patches, loc='upper right', prop={'size': 10})
    plt.show()


def cluster_accounts(application_id, topic_model=None):
    with engine.begin() as connection:
        topic_model = models.topic_model.select_latest(application_id, SOURCES['TWITTER'], connection)

        if not topic_model:
            return

        topics = list(models.topic.select_multiple(topic_model['id'], connection))

        if not topics:
            return

        weights = []
        account_ids = []
        for topic in topics:
            weights.append(topic['weights'])
            account_ids.append(topic['account'])

        weights_matrix = np.array(weights).astype(float)

        tsne = TSNE(n_components=2).fit_transform(weights_matrix)
        db = DBSCAN(eps=1.8, min_samples=5).fit(tsne)

        cluster_labels = db.labels_
        for label, account_id, coords in zip(cluster_labels, account_ids, tsne):
            models.topic.update_cluster(account_id, topic_model['id'], int(label), coords[0], coords[1], connection)

        # plot_accounts(cluster_labels, tsne, weights_matrix, topic_model['topics'])


def createDictionary(application_id):
    dictionary = Dictionary()
    with engine.connect() as connection:
        accounts = models.account.select_multiple_complete(application_id, SOURCES['TWITTER'], connection)
        for account in accounts:
            dictionary.add_documents(
                getwords(status['text']) for status in models.timeline.select_one(account['id'], connection))
    dictionary.filter_extremes(no_below=3, no_above=0.5)
    return dictionary


class MyCorpus(object):
    def __init__(self, dictionary, application_id):
        self.dictionary = dictionary
        self.application_id = application_id

    def __iter__(self):
        with engine.connect() as connection:
            accounts = models.account.select_multiple_complete(self.application_id, SOURCES['TWITTER'], connection)
            for account in accounts:
                timeline = (getwords(status['text']) for status in
                            models.timeline.select_one(account['id'], connection))
                yield self.dictionary.doc2bow(chain.from_iterable(timeline))


def createCorpus(dictionary, application_id):
    return MyCorpus(dictionary, application_id)


def createLdaModel(corpus, dictionary):
    return LdaModel(corpus=corpus, id2word=dictionary, num_topics=NUM_TOPICS, alpha=0.001)


def getTopicWords(lda_model, num_words=10):
    return [[word for word, weight in topic] for _, topic in
            lda_model.show_topics(num_topics=NUM_TOPICS, num_words=num_words, formatted=False)]


def getDocumentTopicWeights(lda_model, bow):
    return [weight for topic, weight in lda_model.get_document_topics(bow, minimum_probability=0)]


def plotLda():
    lda_model = LdaModel.load('lda_model/ldamodel')
    SerializedCorpus = MmCorpus('lda_model/corpus.mm')
    dictionary = Dictionary.load('lda_model/dictionary')
    vis_data = gensim.prepare(lda_model, SerializedCorpus, dictionary)
    pyLDAvis.save_html(vis_data, 'lda_model/lda_visualization.html')


def createTopicModel(application_id):
    with engine.begin() as connection:
        dictionary = createDictionary(application_id)
        corpus = createCorpus(dictionary, application_id)
        dictionary.save('lda_model/dictionary')
        MmCorpus.serialize('lda_model/corpus.mm', corpus)
        corpus = MmCorpus('lda_model/corpus.mm')
        lda_model = createLdaModel(corpus, dictionary)
        lda_model.save('lda_model/ldamodel')
        lda_model = LdaModel.load('lda_model/ldamodel')
        topics_words = getTopicWords(lda_model, NUM_TOPIC_WORDS)
        models.topic_model.insert_one(application_id, SOURCES['TWITTER'], topics_words, connection)
