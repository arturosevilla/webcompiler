try:
    from setuptools import setup, find_packages
except ImportError:
    from ez_setup import use_setuptools
    use_setuptools()
    from setuptools import setup, find_packages

setup(
    name='webcompiler',
    version='0.1',
    description='',
    author='Arturo Sevilla',
    author_email='arturosevilla@gmail.com',
    url='',
    install_requires=[
	'Flask'
    ],
    packages=find_packages(exclude=['ez_setup']),
    include_package_data=True,
    zip_safe=False
)
