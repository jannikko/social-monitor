from gensim.corpora import Dictionary, MmCorpus
from gensim.models.ldamodel import LdaModel
from preprocess import getwords
from pyLDAvis import gensim
from enums import SOURCES
from sklearn.cluster import DBSCAN
from sklearn.manifold import TSNE
from models import engine
from typing import Iterable
from sqlalchemy.engine import Connection
import os
import timeit
import multiprocessing
import models.account
import models.topic
import models.topic_model
import models.topic_iteration
import models.timeline
import numpy as np
import logging
import pyLDAvis

logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

NUM_TOPICS = 30
NUM_TOPIC_WORDS = 10


def create_folder_if_not_exists(path: str) -> None:
    if not os.path.exists(path):
        os.makedirs(path)


def get_topic_model_path(application_id: str) -> str:
    dir = os.path.dirname(__file__)
    return os.path.join(dir, '../lda_model/%s/' % application_id)


def calculate_topics(application_id: str) -> None:
    """Uses the latest topic model to assign a topic for each completely fetched account in the database."""
    with engine.begin() as connection:
        topic_model = models.topic_model.select_latest(application_id, SOURCES['TWITTER'], connection)

        if not topic_model:
            return

        accounts = list(models.account.select_multiple_complete(application_id, SOURCES['TWITTER'], connection))
        topic_model_path = get_topic_model_path(application_id)
        lda_model = LdaModel.load(os.path.join(topic_model_path, 'ldamodel'))
        dictionary = Dictionary.load(os.path.join(topic_model_path, 'dictionary'))
        documents = load_documents(accounts, connection)
        topic_iteration_id = models.topic_iteration.insert_one(topic_model['id'], connection)
        for account, document in zip(accounts, documents):
            bow = dictionary.doc2bow(document)
            weights = get_document_topic_weights(lda_model, bow)
            models.topic.insert_one(account['id'], weights, topic_iteration_id, connection)
        cluster_accounts(topic_iteration_id, connection)


def cluster_accounts(topic_iteration_id: str, connection: Connection) -> None:
    """Perform a clustering on all accounts for the latest topic model"""
    topics = list(models.topic.select_multiple(topic_iteration_id, connection))

    if not topics:
        return

    weights = []
    account_ids = []
    for topic in topics:
        weights.append(topic['weights'])
        account_ids.append(topic['account'])

    weights_matrix = np.array(weights).astype(float)

    tsne = TSNE(n_components=2, metric='cosine').fit_transform(weights_matrix)
    db = DBSCAN(eps=1.75, min_samples=5).fit(tsne)

    cluster_labels = db.labels_
    for label, account_id, coords in zip(cluster_labels, account_ids, tsne):
        models.topic.update_cluster(account_id, topic_iteration_id, int(label), coords[0], coords[1], connection)


def create_dictionary(documents):
    """Create the dictionary from the provided documents"""
    dictionary = Dictionary(documents)
    dictionary.filter_extremes(no_below=3, no_above=0.5)
    return dictionary


def document_to_tokens(timeline: dict) -> list:
    """Takes a timeline dictionary and creates a list of preprocessed tokens"""
    document = " ".join(status['text'] for status in timeline)
    return getwords(document)


def load_documents(accounts: Iterable, connection: Connection, last_date=None) -> list:
    """Loads all timelines from the database for the accounts and creates tokens from them."""
    documents = []
    for account in accounts:
        documents.append(list(models.timeline.select_one(account['id'], connection, last_date)))
    start_time = timeit.default_timer()
    logging.info('Preprocessing documents')
    pool = multiprocessing.Pool(3)
    documents = pool.imap_unordered(document_to_tokens, documents)
    logging.debug('Preprocessing finished. Execution time: %s' % (timeit.default_timer() - start_time))
    return list(documents)


class MyCorpus(object):
    def __init__(self, dictionary, documents):
        self.dictionary = dictionary
        self.documents = documents

    def __iter__(self):
        for document in self.documents:
            yield self.dictionary.doc2bow(document)


def create_lda_model(corpus: MmCorpus, dictionary: Dictionary) -> LdaModel:
    """Creates the topic model from the provided corpus and dictionary."""
    return LdaModel(corpus=corpus, id2word=dictionary, num_topics=NUM_TOPICS, alpha=0.001, passes=20)


def get_topic_words(lda_model: LdaModel, num_words=10) -> list:
    """Returns a topic/words matrix for each topic found in the topic model"""
    return [[word for word, weight in topic] for _, topic in
            lda_model.show_topics(num_topics=NUM_TOPICS, num_words=num_words, formatted=False)]


def get_document_topic_weights(lda_model: LdaModel, bow) -> list:
    """Returns the topic/weights matrix of the topic model"""
    return [weight for topic, weight in lda_model.get_document_topics(bow, minimum_probability=0)]


def plot_lda(application_id):
    """Saves a html file that visualizes the topic model"""
    topic_model_path = get_topic_model_path(application_id)
    lda_model = LdaModel.load(os.path.join(topic_model_path, 'ldamodel'))
    SerializedCorpus = MmCorpus(os.path.join(topic_model_path, 'corpus.mm'))
    dictionary = Dictionary.load(os.path.join(topic_model_path, 'dictionary'))
    vis_data = gensim.prepare(lda_model, SerializedCorpus, dictionary)
    pyLDAvis.save_html(vis_data, os.path.join(topic_model_path, 'lda_visualization.html'))


def create_topic_model(application_id: str) -> None:
    """Creates the topic model from all completely fetched accounts"""
    logging.info('Starting to create topic model for application id: %s' % application_id)
    with engine.begin() as connection:
        logging.info('Requesting complete accounts')
        accounts = list(models.account.select_multiple_complete(application_id, SOURCES['TWITTER'], connection))

        logging.info('Loading documents')
        documents = load_documents(accounts, connection)

        topic_model_path = get_topic_model_path(application_id)
        create_folder_if_not_exists(topic_model_path)

        logging.info('Creating dictionary')
        dictionary = create_dictionary(documents)
        dictionary.save(os.path.join(topic_model_path, 'dictionary'))

        logging.info('Creating corpus')
        MmCorpus.serialize(os.path.join(topic_model_path, 'corpus.mm'), MyCorpus(dictionary, documents))
        corpus = MmCorpus(os.path.join(topic_model_path, 'corpus.mm'))

        logging.info('Creating LDA Model')
        lda_model = create_lda_model(corpus, dictionary)
        lda_model.save(os.path.join(topic_model_path, 'ldamodel'))
        topics_words = get_topic_words(lda_model, NUM_TOPIC_WORDS)
        models.topic_model.insert_one(application_id, SOURCES['TWITTER'], topics_words, connection)
