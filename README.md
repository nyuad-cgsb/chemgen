# Labeling Images

Labeling the images requires the label image repo: https://github.com/tzutalin/labelImg

Get the deps with conda:

```
git clone https://github.com/tzutalin/labelImg
conda create -p ${HOME}/.local/software/labelimg
source activate {$HOME}/.local/software/labelimg
conda install -y python=3 lxml qt setuptools ipython pyqt
cd labelImg
make qt5py3
python ./labelImage.py
```

# Dependencies for Machine Learning

```
conda create -p ${HOME}/.local/software/image_classification
source activate  ${HOME}/.local/software/image_classification
conda install -y r r-base r-essentials rstudio r-cairo r-irkernel scikit-learn tensorflow spyder ipython numpy pandas matplotlib jupyter jupyterhub protobuf
```
