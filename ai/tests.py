from workers.timeline import calculate_max_iterations
import unittest


class calculate_max_iterations_test(unittest.TestCase):
    def test_undefined(self):
        self.assertEquals(2, calculate_max_iterations(40, 20))
        self.assertEquals(2, calculate_max_iterations(43, 20))
