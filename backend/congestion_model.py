from sklearn.tree import DecisionTreeClassifier
import numpy as np

X = np.array([
    [5],
    [8],
    [10],
    [15],
    [20],
    [25],
    [30],
    [40],
    [50]
])

y = np.array([
    0,
    0,
    0,
    1,
    1,
    1,
    2,
    2,
    2
])

model = DecisionTreeClassifier()
model.fit(X, y)


def predict_congestion(queue_size):
    result = model.predict([[queue_size]])[0]

    if result == 0:
        return "Low"

    elif result == 1:
        return "Medium"

    return "High"