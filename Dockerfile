FROM dart:stable
WORKDIR /app
COPY pubspec.yaml ./
RUN dart pub get
COPY main.dart index.html ./
EXPOSE 4173
CMD ["dart", "run", "main.dart"]
